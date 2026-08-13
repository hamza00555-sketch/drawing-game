/**
 * وش ذا؟ — trusted game logic.
 *
 * Only what security rules genuinely cannot express lives here: assigning the
 * impostor and the word, advancing phases, tallying votes, and awarding points.
 * Everything else — strokes, presence, votes, guesses — is written directly by
 * clients under rules, because a Cloud Function on a latency-sensitive path
 * costs a cold start the game cannot afford.
 *
 * These run with the Admin SDK, which bypasses security rules. That is exactly
 * why every node they own is `".write": false` for clients.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { MOZAWWER, MOZAWWER_WORDS, scoreMozawwerRound, tallyVotes, isCorrectGuess } from './game';

admin.initializeApp();
const db = admin.database();

// Each mode lives in its own module; re-exported so they deploy together.
export { startKammilRound, advanceKammil } from './kammil';
export {
  startMamnouRound,
  beginMamnouDrawing,
  submitMamnouGuess,
  endMamnouRound,
} from './mamnou3at';
export { startMushtarakRound, advanceMushtarak } from './mushtarak';

interface RoomPlayer {
  id: string;
  name: string;
  characterId: string;
  joinedAt: number;
}

async function requireHost(roomId: string, uid: string): Promise<void> {
  const snapshot = await db.ref(`rooms/${roomId}/hostId`).get();
  if (snapshot.val() !== uid) {
    throw new HttpsError('permission-denied', 'المضيف فقط يقدر يسوي هذا.');
  }
}

async function connectedPlayers(roomId: string): Promise<RoomPlayer[]> {
  const [playersSnap, presenceSnap] = await Promise.all([
    db.ref(`roomPlayers/${roomId}`).get(),
    db.ref(`presence/${roomId}`).get(),
  ]);

  const players = (playersSnap.val() ?? {}) as Record<string, RoomPlayer>;
  const presence = (presenceSnap.val() ?? {}) as Record<string, { connected?: boolean }>;

  return Object.values(players)
    .filter((player) => presence[player.id]?.connected !== false)
    .sort((a, b) => a.joinedAt - b.joinedAt);
}

/** Fisher-Yates. Turn order must not be predictable from join order. */
function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/**
 * Start a round of المزوّر.
 *
 * The critical part is how secrets are written: each player gets their OWN node
 * under playerSecrets, and the impostor's node has no `word` key at all. The
 * word is never in a payload the impostor's device can read, so there is
 * nothing for them to uncover. See ARCHITECTURE.md §3.
 */
export const startMozawwerRound = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'سجّل دخول أولاً.');

  const roomId = String(request.data?.roomId ?? '');
  if (!roomId) throw new HttpsError('invalid-argument', 'ينقص معرّف الغرفة.');

  await requireHost(roomId, uid);

  const players = await connectedPlayers(roomId);
  if (players.length < 3) {
    throw new HttpsError('failed-precondition', 'نحتاج 3 لاعبين على الأقل.');
  }

  const settingsSnap = await db.ref(`rooms/${roomId}/settings/mozawwer`).get();
  const settings = { ...MOZAWWER, ...(settingsSnap.val() ?? {}) };

  const usedSnap = await db.ref(`rooms/${roomId}/usedWords`).get();
  const used = new Set<string>(Object.values(usedSnap.val() ?? {}) as string[]);
  const pool = MOZAWWER_WORDS.filter((w) => !used.has(w.word));
  const source = pool.length > 0 ? pool : MOZAWWER_WORDS;
  const chosen = source[Math.floor(Math.random() * source.length)];
  if (!chosen) throw new HttpsError('internal', 'تعذّر اختيار كلمة.');

  const turnOrder = shuffle(players.map((p) => p.id));
  const impostorId = turnOrder[Math.floor(Math.random() * turnOrder.length)] as string;
  const gameId = db.ref().push().key as string;

  // Per-player secrets. The impostor's object deliberately omits `word`.
  const secrets: Record<string, { role: string; word?: string }> = {};
  for (const player of players) {
    secrets[player.id] =
      player.id === impostorId ? { role: 'impostor' } : { role: 'artist', word: chosen.word };
  }

  await db.ref().update({
    [`playerSecrets/${roomId}/${gameId}`]: secrets,
    [`rooms/${roomId}/status`]: 'playing',
    [`rooms/${roomId}/usedWords/${gameId}`]: chosen.word,
    [`games/${roomId}/current`]: {
      gameId,
      mode: 'mozawwer',
      phase: 'roleReveal',
      phaseEndsAt: admin.database.ServerValue.TIMESTAMP,
      currentPlayerId: turnOrder[0],
      turnOrder,
      turnIndex: 0,
      turnsTaken: 0,
      // Kept server-side only. Clients learn it at the reveal.
      impostorId,
      word: chosen.word,
      settings,
    },
  });

  return { gameId };
});

/**
 * Advance the round.
 *
 * One entry point for every transition so the legal order lives in a single
 * place. A client asks to move on; the server decides whether that is allowed
 * and what the next state actually is.
 */
export const advanceMozawwer = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'سجّل دخول أولاً.');

  const roomId = String(request.data?.roomId ?? '');
  const action = String(request.data?.action ?? '');

  const gameRef = db.ref(`games/${roomId}/current`);
  const game = (await gameRef.get()).val();
  if (!game) throw new HttpsError('failed-precondition', 'ما في جولة شغّالة.');

  const isMember = (await db.ref(`roomPlayers/${roomId}/${uid}`).get()).exists();
  if (!isMember) throw new HttpsError('permission-denied', 'أنت مو في هذي الغرفة.');

  const settings = { ...MOZAWWER, ...(game.settings ?? {}) };
  const turnOrder: string[] = game.turnOrder ?? [];

  switch (action) {
    case 'beginDrawing': {
      if (game.phase !== 'roleReveal') return { phase: game.phase };
      await gameRef.update({
        phase: 'draw',
        phaseEndsAt: Date.now() + settings.turnMs,
      });
      return { phase: 'draw' };
    }

    case 'endTurn': {
      if (game.phase !== 'draw') return { phase: game.phase };
      // Only the active player ends their own turn.
      if (game.currentPlayerId !== uid) {
        throw new HttpsError('permission-denied', 'مو دورك.');
      }

      const turnsTaken = (game.turnsTaken ?? 0) + 1;
      const turnIndex = (game.turnIndex + 1) % Math.max(1, turnOrder.length);

      // Hard ceiling so a room that never presses "ready" still finishes.
      if (turnsTaken >= settings.maxTurns) {
        await gameRef.update({
          phase: 'vote',
          phaseEndsAt: Date.now() + settings.votingMs,
          currentPlayerId: null,
          turnsTaken,
        });
        return { phase: 'vote' };
      }

      await gameRef.update({
        turnIndex,
        turnsTaken,
        currentPlayerId: turnOrder[turnIndex],
        phaseEndsAt: Date.now() + settings.turnMs,
      });
      return { phase: 'draw' };
    }

    case 'readyToVote': {
      if (game.phase !== 'draw') return { phase: game.phase };
      if ((game.turnsTaken ?? 0) < settings.minTurnsBeforeReady) {
        throw new HttpsError('failed-precondition', 'الرسمة لسه بدايتها.');
      }

      const hostId = (await db.ref(`rooms/${roomId}/hostId`).get()).val();
      const ready: string[] = Object.keys(game.readyToVote ?? {});
      const connected = (await connectedPlayers(roomId)).length;

      let allowed = false;
      switch (settings.readyToVoteRule) {
        case 'host_only':
          allowed = uid === hostId;
          break;
        case 'majority':
          allowed = new Set([...ready, uid]).size > connected / 2;
          break;
        default:
          allowed = true;
      }

      if (!allowed) {
        // Record the request; a later voter may complete the majority.
        await gameRef.child(`readyToVote/${uid}`).set(true);
        return { phase: 'draw', pending: true };
      }

      await gameRef.update({
        phase: 'vote',
        phaseEndsAt: Date.now() + settings.votingMs,
        currentPlayerId: null,
      });
      return { phase: 'vote' };
    }

    case 'closeVoting': {
      if (game.phase !== 'vote') return { phase: game.phase };

      const votes = ((await db.ref(`votes/${roomId}/${game.gameId}`).get()).val() ??
        {}) as Record<string, string>;
      const { accusedId, counts } = tallyVotes(votes);
      const caught = accusedId === game.impostorId;

      await gameRef.update({
        phase: 'reveal',
        phaseEndsAt: Date.now() + 6000,
        // Safe to publish now: the round is over.
        accusedId: accusedId ?? null,
        voteCounts: counts,
        caught,
        revealedWord: game.word,
      });
      return { phase: 'reveal', caught };
    }

    case 'afterReveal': {
      if (game.phase !== 'reveal') return { phase: game.phase };

      // A surviving impostor already won; there is nothing left to guess for.
      if (!game.caught) {
        await finishRound(roomId, game, false);
        return { phase: 'result' };
      }

      await gameRef.update({
        phase: 'impostorGuess',
        phaseEndsAt: Date.now() + settings.impostorGuessMs,
      });
      return { phase: 'impostorGuess' };
    }

    case 'impostorGuess': {
      if (game.phase !== 'impostorGuess') return { phase: game.phase };
      if (uid !== game.impostorId) {
        throw new HttpsError('permission-denied', 'هذي فرصة المزوّر.');
      }

      const guess = String(request.data?.guess ?? '');
      const correct = isCorrectGuess(guess, game.word);
      await finishRound(roomId, game, correct);
      return { phase: 'result', correct };
    }

    default:
      throw new HttpsError('invalid-argument', `إجراء غير معروف: ${action}`);
  }
});

/** Award points and close the round. Scores are only ever written here. */
async function finishRound(
  roomId: string,
  game: {
    gameId: string;
    impostorId: string;
    caught?: boolean;
    turnOrder?: string[];
  },
  impostorGuessedWord: boolean,
): Promise<void> {
  const votes = ((await db.ref(`votes/${roomId}/${game.gameId}`).get()).val() ?? {}) as Record<
    string,
    string
  >;

  const delta = scoreMozawwerRound({
    impostorId: game.impostorId,
    votes,
    playerIds: game.turnOrder ?? [],
    caught: Boolean(game.caught),
    impostorGuessedWord,
  });

  const updates: Record<string, unknown> = {
    [`games/${roomId}/current/phase`]: 'result',
    [`games/${roomId}/current/phaseEndsAt`]: null,
    [`games/${roomId}/current/impostorGuessedWord`]: impostorGuessedWord,
    [`rooms/${roomId}/status`]: 'lobby',
  };

  // Read-modify-write per player rather than a transaction: scores are only
  // written here, by one function, at one moment in the round.
  const current = ((await db.ref(`playerScores/${roomId}`).get()).val() ?? {}) as Record<
    string,
    number
  >;
  for (const [playerId, points] of Object.entries(delta)) {
    updates[`playerScores/${roomId}/${playerId}`] = (current[playerId] ?? 0) + points;
  }

  await db.ref().update(updates);
}
