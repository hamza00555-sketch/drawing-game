/**
 * Live round state — the client half of the trusted logic in `server/`.
 *
 * Three kinds of thing live here, and the distinction matters:
 *
 *   1. **Subscriptions** to what the server has decided. Phases, deadlines,
 *      whose turn it is, scores. The client never computes these; it reads them.
 *   2. **Direct writes** a player legitimately owns — a vote — which the
 *      security rules police without a round trip through a server.
 *   3. **Calls** into the trusted logic for everything a client must not be
 *      trusted with: starting a round, advancing a phase, judging a guess.
 *
 * Every subscription targets the narrowest path that answers its question.
 * Guesses arriving must not wake the scoreboard, and a score change must not
 * re-deliver the player list.
 */

import { onValue, ref, set } from 'firebase/database';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { ensureSignedIn, getDb, usingEmulators } from './firebase';
import { paths } from './paths';
import type { GameMode } from './room';

/**
 * The public game node.
 *
 * Everything here is readable by every member of the room, which is precisely
 * why the word, the impostor, the split prompt, the taboo list and the seed
 * sentence are NOT here — they live in `gameSecrets`, which no client can read,
 * and cross over into these fields only once the round has revealed them.
 * See server/secrets.ts.
 */
export interface GameState {
  gameId: string;
  mode: GameMode;
  phase: string;
  phaseEndsAt?: number | null;
  currentPlayerId?: string | null;

  // المزوّر
  turnOrder?: string[];
  turnIndex?: number;
  turnsTaken?: number;
  settings?: Record<string, unknown>;
  accusedId?: string | null;
  voteCounts?: Record<string, number>;
  caught?: boolean;
  impostorGuessedWord?: boolean;

  // كمّل رسمتي
  artistIds?: string[];
  guesserId?: string;
  turnMs?: number;
  guess?: string;
  correct?: boolean;
  /** Duo only: countdown length actually used. */
  countdownMs?: number;
  /** Duo only: which draw-then-guess stage the round is on, and how many. */
  stage?: number;
  totalStages?: number;
  /** Duo only: what the guesser said last stage, shown back to the artist. */
  lastGuess?: string;

  // الممنوعات
  artistId?: string;
  guesserIds?: string[];
  ranked?: string[];
  revealedForbidden?: string[];

  /** Two-player rooms run a shorter, rebalanced ruleset for this mode. */
  isDuo?: boolean;
  /** الممنوعات (duo): the round's brief/draw lengths, as actually used. */
  briefMs?: number;
  drawMs?: number;

  // الرسم المشترك
  activeDrawers?: Record<string, boolean>;
  gotYouUsedBy?: Record<string, boolean>;
  gotYouFrom?: string;
  gotYouAt?: number;
  correctGuesserIds?: string[];
  partA?: string;
  partB?: string;
  full?: string;
  /** Duo only: total short turns this round alternates through. */
  totalSwaps?: number;

  // كانت إيش؟
  currentIndex?: number;
  totalLinks?: number;
  authorByIndex?: Record<string, string>;
  visibleTo?: Record<string, Record<string, boolean>>;
  seed?: string;
  /** Duo only: two independent chains instead of one, keyed '0' | '1'. */
  linksPerTrack?: number;
  tracks?: Record<
    string,
    {
      ownerId: string;
      authorByIndex: Record<string, string>;
    }
  >;
  /** Duo only: which tracks have filed their link for the current index. */
  submitted?: Record<string, Record<string, boolean>>;
  seedA?: string;
  seedB?: string;

  /** Published at the reveal, never before. */
  revealedWord?: string;
  impostorId?: string;

  /** Points gained this round, per player. Totals live in `playerScores`. */
  scoreDelta?: Record<string, number>;
}

/** This player's private payload. Absent keys are the point — see ARCHITECTURE §3. */
export interface PlayerSecret {
  role: string;
  /** Present only for players who are allowed to know it. */
  word?: string;
  forbidden?: string[];
  /** الممنوعات: the letter count guessers get instead of the word. */
  hint?: string;
  /** الرسم المشترك: this artist's half of the prompt. */
  part?: string;
}

export interface GuessRecord {
  id: string;
  playerId: string;
  text: string;
  at: number;
  correct?: boolean;
}

export interface ChainLinkRecord {
  index: number;
  type: 'text' | 'drawing';
  playerId: string;
  content: string;
}

/**
 * Subscribe to a value that a player may legitimately be refused.
 *
 * Several of these paths are *supposed* to be unreadable most of the time: the
 * vote tally before the reveal, a chain link that is not yours. A permission
 * denial there is the rules working, not an error, so it is reported as "no
 * value" rather than thrown — the caller renders the same empty state either
 * way, and a rejected listener that threw would take the screen down with it.
 */
function watchAllowed<T>(
  path: string,
  onChange: (value: T | undefined) => void,
): () => void {
  return onValue(
    ref(getDb(), path),
    (snapshot) => onChange((snapshot.val() as T | null) ?? undefined),
    () => onChange(undefined),
  );
}

export function watchGame(
  roomId: string,
  onChange: (game: GameState | undefined) => void,
): () => void {
  return watchAllowed<GameState>(paths.game(roomId), onChange);
}

/**
 * This player's own secret payload.
 *
 * The rule on this path allows exactly one reader, so there is no filtering to
 * do here: the database refuses anyone else. The impostor's payload has no
 * `word` key at all, which is why the mode's secret survives DevTools.
 */
export function watchMySecret(
  roomId: string,
  gameId: string,
  playerId: string,
  onChange: (secret: PlayerSecret | undefined) => void,
): () => void {
  return watchAllowed<PlayerSecret>(paths.playerSecret(roomId, gameId, playerId), onChange);
}

export function watchScores(
  roomId: string,
  onChange: (scores: Record<string, number>) => void,
): () => void {
  return watchAllowed<Record<string, number>>(paths.scores(roomId), (value) =>
    onChange(value ?? {}),
  );
}

/** Who voted — not who they picked. Sealed by the rules until the reveal. */
export function watchVotes(
  roomId: string,
  gameId: string,
  onChange: (votes: Record<string, string>) => void,
): () => void {
  return watchAllowed<Record<string, string>>(paths.votes(roomId, gameId), (value) =>
    onChange(value ?? {}),
  );
}

export function watchGuesses(
  roomId: string,
  gameId: string,
  onChange: (guesses: GuessRecord[]) => void,
): () => void {
  return watchAllowed<Record<string, Omit<GuessRecord, 'id'>>>(
    paths.guesses(roomId, gameId),
    (value) => {
      const records = Object.entries(value ?? {}).map(([id, guess]) => ({ id, ...guess }));
      // Oldest first: rank in الممنوعات is the order people got there.
      onChange(records.sort((a, b) => a.at - b.at));
    },
  );
}

/**
 * One link of a كانت إيش؟ chain.
 *
 * Deliberately per-index rather than a subscription to the whole chain: during
 * play a player may read exactly one link, and asking for the parent node would
 * be refused wholesale — including the one link they are entitled to.
 */
export function watchChainLink(
  roomId: string,
  gameId: string,
  index: number,
  onChange: (link: ChainLinkRecord | undefined) => void,
): () => void {
  return watchAllowed<Omit<ChainLinkRecord, 'index'>>(
    paths.chainLink(roomId, gameId, index),
    (value) => onChange(value ? { index, ...value } : undefined),
  );
}

/** The whole chain. Only readable once the round has reached its reveal. */
export function watchChain(
  roomId: string,
  gameId: string,
  onChange: (links: ChainLinkRecord[]) => void,
): () => void {
  return watchAllowed<Record<string, Omit<ChainLinkRecord, 'index'>>>(
    paths.chain(roomId, gameId),
    (value) => {
      const links = Object.entries(value ?? {}).map(([key, link]) => ({
        index: Number(key),
        ...link,
      }));
      onChange(links.sort((a, b) => a.index - b.index));
    },
  );
}

/** كانت إيش؟ Duo only: one link of one track. Same narrowness as `watchChainLink`. */
export function watchDuoChainLink(
  roomId: string,
  gameId: string,
  track: string,
  index: number,
  onChange: (link: ChainLinkRecord | undefined) => void,
): () => void {
  return watchAllowed<Omit<ChainLinkRecord, 'index'>>(
    paths.duoChainLink(roomId, gameId, track, index),
    (value) => onChange(value ? { index, ...value } : undefined),
  );
}

/** كانت إيش؟ Duo only: one whole track. Readable once the round reveals. */
export function watchDuoChain(
  roomId: string,
  gameId: string,
  track: string,
  onChange: (links: ChainLinkRecord[]) => void,
): () => void {
  return watchAllowed<Record<string, Omit<ChainLinkRecord, 'index'>>>(
    paths.duoChain(roomId, gameId, track),
    (value) => {
      const links = Object.entries(value ?? {}).map(([key, link]) => ({
        index: Number(key),
        ...link,
      }));
      onChange(links.sort((a, b) => a.index - b.index));
    },
  );
}

/**
 * Cast a vote.
 *
 * Written straight to the database rather than through a function: the rules
 * already enforce everything that matters — your own vote, once, only during
 * the voting phase, only for a real player — and a cold start on a 30-second
 * timer would be felt.
 */
export async function castVote(
  roomId: string,
  gameId: string,
  voterId: string,
  targetId: string,
): Promise<void> {
  await set(ref(getDb(), paths.vote(roomId, gameId, voterId)), targetId);

  // Second, separate write: the room may see THAT you voted, never for whom.
  // Splitting it is what lets the tally stay sealed while the screen still
  // shows the round moving.
  await set(ref(getDb(), paths.voteMark(roomId, gameId, voterId)), true);
}

/** Who has finished voting. Readable throughout, unlike the votes themselves. */
export function watchVoteMarks(
  roomId: string,
  gameId: string,
  onChange: (voterIds: string[]) => void,
): () => void {
  return watchAllowed<Record<string, boolean>>(paths.voteMarks(roomId, gameId), (value) =>
    onChange(Object.keys(value ?? {})),
  );
}

let functionsEmulatorConnected = false;

/**
 * Local development: talk to the Functions emulator.
 *
 * The emulator runs the same handlers `server/` exports, wrapped as callables,
 * so a local round exercises the real logic. Production does not use callables
 * at all — see `callGame`.
 */
function emulatorCallable(name: string) {
  const functions = getFunctions(getApp());

  if (!functionsEmulatorConnected) {
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    functionsEmulatorConnected = true;
  }

  return httpsCallable(functions, name);
}

/**
 * Call trusted logic.
 *
 * Anything that decides an outcome goes through here. The client is asking, not
 * telling: the server re-reads the true state and may well refuse.
 *
 * In production this is an ordinary POST to `/api/game`, carrying the Firebase
 * ID token the browser already holds. The endpoint verifies that token with the
 * Admin SDK, so the identity behind every permission check is exactly as solid
 * as it was under Cloud Functions — Firebase is still what issues and proves
 * who a player is. Only the place the code runs has moved, because Cloud
 * Functions require a paid plan and this project runs on the free one.
 */
export async function callGame<T = unknown>(
  name: string,
  data: Record<string, unknown>,
): Promise<T> {
  if (usingEmulators()) {
    const result = await emulatorCallable(name)(data);
    return result.data as T;
  }

  const user = await ensureSignedIn();
  const token = await user.getIdToken();

  const response = await fetch('/api/game', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fn: name, ...data }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    result?: T;
    error?: string;
    code?: string;
  };

  if (!response.ok) {
    /*
     * The server writes its refusals for the player to read, so the message is
     * passed through untouched — `describeCallFailure` recognises them by being
     * in Arabic. The code rides along so an unexpected failure can still be
     * identified.
     */
    throw Object.assign(new Error(payload.error ?? `HTTP ${response.status}`), {
      code: payload.code ?? `http/${response.status}`,
    });
  }

  return payload.result as T;
}

/** Arabic script. Used to tell our own error messages from a transport's. */
const ARABIC = /[؀-ۿ]/;

export interface CallFailure {
  message: string;
  /** True when the trusted logic does not appear to be reachable at all. */
  functionsMissing: boolean;
}

/**
 * Turn a failed call into something worth showing a player.
 *
 * The distinction that matters is between "the server considered your request
 * and said no" and "there is no server". The first already arrives in Arabic,
 * written by us — `مو دورك`, `نحتاج 3 لاعبين على الأقل` — and is passed through
 * untouched. The second arrives as a status code or a fetch failure, which
 * tells a player nothing.
 *
 * The script of the message is the reliable signal: every refusal the trusted
 * logic raises is Arabic, and nothing a transport invents is.
 */
export function describeCallFailure(error: unknown): CallFailure {
  const raw = error instanceof Error ? error.message : String(error);
  if (ARABIC.test(raw)) return { message: raw, functionsMissing: false };

  const code = (error as { code?: string } | undefined)?.code ?? '';

  // Nothing answered at that address: the endpoint is not deployed, or a
  // rewrite is swallowing /api before it gets there.
  if (code === 'http/404' || code === 'functions/not-found' || code === 'functions/unavailable') {
    return {
      functionsMissing: true,
      message:
        'المنطق الموثوق مو منشور. تأكد أن /api/game موجود ومتغيرات الخادم مضبوطة — شوف DEPLOY.md.',
    };
  }

  if (code === 'http/500' || code === 'internal' || code === 'functions/internal') {
    return {
      functionsMissing: false,
      message: 'المنطق الموثوق رجع خطأ. راجع سجل الدوال في Vercel.',
    };
  }

  // fetch() rejects with a TypeError and no code when the request never lands.
  if (!code || raw.includes('fetch') || raw.includes('network')) {
    return { message: 'ما قدرنا نوصل للخادم. تأكد من الاتصال.', functionsMissing: false };
  }

  return { message: `ما قدرنا نبدأ الجولة. (${code})`, functionsMissing: false };
}

/** Which function starts a round, per mode. */
const START_FUNCTION: Record<GameMode, string> = {
  mozawwer: 'startMozawwerRound',
  kammil: 'startKammilRound',
  mamnou3at: 'startMamnouRound',
  mushtarak: 'startMushtarakRound',
  kanatEsh: 'startKanatEshRound',
};

export async function startRound(roomId: string, mode: GameMode): Promise<string> {
  const { gameId } = await callGame<{ gameId: string }>(START_FUNCTION[mode], { roomId });
  return gameId;
}
