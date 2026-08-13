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
 * CommonJS Node build.
 */

export const KAMMIL = {
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
 * The guesser is picked at random rather than always being last to join, so the
 * same person does not end up guessing every round of a long session.
 */
export function assignKammilRoles(
  playerIds: readonly string[],
  random: () => number = Math.random,
): { artistIds: string[]; guesserId: string } {
  if (playerIds.length < 3) {
    throw new Error('كمّل رسمتي يحتاج 3 لاعبين على الأقل.');
  }

  const index = Math.min(Math.floor(random() * playerIds.length), playerIds.length - 1);
  const guesserId = playerIds[index] as string;

  return {
    artistIds: playerIds.filter((id) => id !== guesserId),
    guesserId,
  };
}

export interface KammilRoundInput {
  artistIds: readonly string[];
  guesserId: string;
  correct: boolean;
}

export type KammilScoreDelta = Record<string, number>;

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
