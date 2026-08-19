/**
 * وش ذا؟ — كمّل رسمتي shared logic.
 *
 * Compiled into BOTH the client bundle and the Cloud Functions build, for the
 * same reason as shared/mozawwer.ts: the server decides turn length and awards
 * points, and the client must predict both identically.
 *
 * The mode: everyone except the last player knows the word. Each artist gets a
 * 3-second countdown with the pen locked, then a brutally short drawing turn on
 * the shared canvas, then the pen locks again automatically. The last player
 * never draws, never learns the word, and has to name whatever the room
 * produced.
 *
 * The panic is the mechanic. Turn lengths are deliberately too short to draw
 * anything properly, which is what makes the result worth looking at.
 *
 * Keep this file dependency-free — it is consumed by an ES module bundler and a
 * CommonJS Node build. No npm packages, only sibling files in shared/.
 */

import { shuffle } from './random.js';

export const KAMMIL = {
  minPlayers: 2,
  /** Pen locked while the artist sees the drawing so far and the word. */
  countdownMs: 3_000,
  /**
   * Drawing time per artist, keyed by artist count (the guesser is excluded).
   * More artists means less time each, so the whole round stays short and the
   * pressure rises with the size of the room.
   */
  drawMsByArtistCount: {
    2: 5_000,
    3: 4_000,
    4: 3_000,
    5: 2_500,
  } as Record<number, number>,
  /** Never go below this, however many artists there are. */
  drawMsFloor: 2_000,
  guessMs: 25_000,
  scores: {
    guesserCorrect: 5,
    /** To every artist when the guesser gets it — their drawing worked. */
    artistsOnSuccess: 2,
    /** Consolation, so a failed round is not a total loss. */
    artistsOnFailure: 1,
  },
  replay: {
    msPerContribution: 900,
    holdOnNameMs: 500,
  },
  /**
   * Two players: one artist, one guesser, swapping roles round to round —
   * assignKammilRoles's duo branch below handles that. Within a round, a
   * wrong guess is not necessarily the end: the artist gets one short bonus
   * window to add to the drawing before the guesser tries again, which is
   * what the `extend` phase in machine.ts exists for.
   */
  duo: {
    countdownMs: 3_000,
    turnMs: 3_500,
    guessMs: 12_000,
    extendMs: 4_000,
    /** How many times a wrong guess may trigger a bonus drawing window. */
    maxExtensions: 1,
    scores: {
      guesserCorrectFirstTry: 4,
      /** Less than a first-try correct: the extension gave a second look. */
      guesserCorrectAfterExtend: 2,
      artistOnSuccess: 2,
      artistOnFailure: 1,
    },
    replay: {
      msPerContribution: 500,
      holdOnNameMs: 300,
    },
  },
} as const;

/**
 * Drawing time for one turn.
 *
 * `artistCount` EXCLUDES the final guesser, who never draws. Falls back to the
 * largest configured tier, so a room of nine artists gets the 5-artist value
 * rather than undefined.
 */
export function kammilDrawMs(artistCount: number): number {
  const table = KAMMIL.drawMsByArtistCount;
  const tiers = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);

  let chosen: number = KAMMIL.drawMsFloor;
  for (const tier of tiers) {
    if (artistCount >= tier) chosen = table[tier] ?? chosen;
  }
  return Math.max(chosen, KAMMIL.drawMsFloor);
}

/**
 * Split the room into artists and the one guesser.
 *
 * `guesserId` is decided by the caller — see `nextInTurnCycle` in
 * `shared/turnCycle.ts` — so this function's only job is turning "who
 * guesses" into the rest of the round: everyone else, shuffled into a draw
 * order. The shuffle matters on its own: falling back to join order would
 * mean whoever connected first always draws first, every round.
 */
export function assignKammilRoles(
  playerIds: readonly string[],
  guesserId: string,
  random: () => number = Math.random,
): { artistIds: string[]; guesserId: string } {
  if (playerIds.length < KAMMIL.minPlayers) {
    throw new Error(`كمّل رسمتي يحتاج ${KAMMIL.minPlayers} لاعبين على الأقل.`);
  }

  const remaining = playerIds.filter((id) => id !== guesserId);

  return {
    artistIds: shuffle(remaining, random),
    guesserId,
  };
}

export interface KammilRoundInput {
  artistIds: readonly string[];
  guesserId: string;
  correct: boolean;
}

export type KammilScoreDelta = Record<string, number>;

export interface KammilDuoRoundInput {
  artistId: string;
  guesserId: string;
  correct: boolean;
  /** Whether the correct guess came after the bonus extension was used. */
  afterExtend: boolean;
}

export function scoreKammilDuoRound(input: KammilDuoRoundInput): KammilScoreDelta {
  const { artistId, guesserId, correct, afterExtend } = input;
  const { guesserCorrectFirstTry, guesserCorrectAfterExtend, artistOnSuccess, artistOnFailure } =
    KAMMIL.duo.scores;

  const delta: KammilScoreDelta = {};
  if (correct) {
    delta[guesserId] = afterExtend ? guesserCorrectAfterExtend : guesserCorrectFirstTry;
  }
  delta[artistId] = correct ? artistOnSuccess : artistOnFailure;
  return delta;
}

export function scoreKammilRound(input: KammilRoundInput): KammilScoreDelta {
  const { artistIds, guesserId, correct } = input;
  const delta: KammilScoreDelta = {};

  if (correct) delta[guesserId] = KAMMIL.scores.guesserCorrect;

  const perArtist = correct ? KAMMIL.scores.artistsOnSuccess : KAMMIL.scores.artistsOnFailure;
  for (const artistId of artistIds) {
    delta[artistId] = (delta[artistId] ?? 0) + perArtist;
  }

  return delta;
}
