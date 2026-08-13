/**
 * وش ذا؟ — Game Balance
 * -----------------------------------------------------------------------------
 * Every tunable number in the game lives here. No component, no mode machine
 * and no Cloud Function may hardcode a duration, a score value or a rule.
 *
 * These values are copied into `rooms/{roomId}/settings` when a room is created,
 * so a live playtest can be re-balanced from the host device without a redeploy.
 * Read balance from the room, not from this file, at runtime — this is only the
 * default seed. See `resolveBalance()` at the bottom.
 *
 * Everything here is expected to change after the first real playtest.
 */

export const ROOM = {
  minPlayers: 3,
  /**
   * Ten, matching the cast size. Every player in a full room must be able to
   * pick a different character, so the two numbers are locked together and a
   * test asserts it.
   */
  maxPlayers: 10,
  /** Room codes avoid 0/O and 1/I/L — they get misread aloud across a table. */
  codeAlphabet: 'ABCDEFGHJKMNPQRSTUVWXYZ23456789',
  codeLength: 4,
  /** How long a disconnected player keeps their seat and score before eviction. */
  reconnectGraceMs: 60_000,
} as const;

/**
 * Who is allowed to end the drawing stage in المزوّر and move everyone to voting.
 *
 * This is deliberately NOT hardcoded. `any_player` is the fastest and most fun
 * default, but it hands the impostor an exploit: they can end the drawing early,
 * before their weak contribution is exposed. If playtesting shows that abuse,
 * switch the room to `majority` or `host_only` without touching game code.
 */
export type ReadyToVoteRule = 'any_player' | 'host_only' | 'majority';

export const MOZAWWER = {
  /** Passes around the shared canvas before "الرسمة جاهزة" is even offered. */
  minTurnsBeforeReady: 2,
  /** Hard ceiling so a room cannot stall forever. */
  maxTurns: 12,
  turnMs: 20_000,
  readyToVoteRule: 'any_player' as ReadyToVoteRule,
  votingMs: 30_000,
  /** The impostor's last chance to name the word after being unmasked. */
  impostorGuessMs: 20_000,
  scores: {
    /** Each non-impostor who voted for the actual impostor. */
    correctVote: 2,
    /** To the impostor, if the vote failed to identify them. */
    impostorSurvived: 5,
    /** To the impostor for naming the word after being caught. */
    impostorGuessedWord: 3,
    /** Split among non-impostors when the impostor is caught. */
    groupCaughtImpostor: 1,
  },
} as const;

export const KAMMIL = {
  countdownMs: 3_000,
  /**
   * Drawing time per artist, keyed by artist count (the guesser is excluded).
   * Brutally short on purpose — the panic IS the game. Falls back to the
   * highest key present, so 6+ artists all get the 5-artist value.
   */
  drawMsByArtistCount: {
    2: 5_000,
    3: 4_000,
    4: 3_000,
    5: 2_500,
  } as Record<number, number>,
  drawMsFloor: 2_000,
  guessMs: 25_000,
  scores: {
    guesserCorrect: 5,
    /** Split among artists when the guesser gets it. Their drawing worked. */
    artistsOnSuccess: 2,
    /** Consolation so a failed round is not a total loss. */
    artistsOnFailure: 1,
  },
  replay: {
    msPerContribution: 900,
    holdOnNameMs: 500,
  },
} as const;

export const MAMNOU3AT = {
  drawMs: 75_000,
  /** How many forbidden elements are shown to the artist. */
  forbiddenCount: 3,
  /** Guessers see letter count only; unlimited attempts while time runs. */
  unlimitedGuesses: true,
  scores: {
    /** Ordered payout for the first correct guessers. */
    guessRank: [3, 2, 1],
    /** Artist earns this per player who guessed correctly. */
    artistPerCorrectGuess: 1,
  },
} as const;

export const MUSHTARAK = {
  drawMs: 60_000,
  guessMs: 30_000,
  /** "فهمتك" — the single limited signal each artist may send per round. */
  gotYouUsesPerArtist: 1,
  scores: {
    guesserCorrect: 3,
    artistsOnSuccess: 2,
  },
  replay: {
    msPerContribution: 700,
  },
} as const;

export const KANAT_ESH = {
  drawMs: 45_000,
  writeMs: 35_000,
  /** Chain length is derived from player count, but clamped for pacing. */
  minLinks: 4,
  maxLinks: 10,
  scores: {
    /** Awarded per link that the next player interpreted faithfully. */
    faithfulLink: 2,
  },
} as const;

/** Wiring only — no audio files are produced yet. See ARCHITECTURE.md. */
export const AUDIO_CUES = [
  'button',
  'stroke',
  'timer_tick',
  'countdown',
  'correct',
  'wrong',
  'reveal',
  'vote',
  'suspense',
  'win',
  'lose',
  'character_reaction',
] as const;

export const DEFAULT_BALANCE = {
  room: ROOM,
  mozawwer: MOZAWWER,
  kammil: KAMMIL,
  mamnou3at: MAMNOU3AT,
  mushtarak: MUSHTARAK,
  kanatEsh: KANAT_ESH,
} as const;

export type Balance = typeof DEFAULT_BALANCE;

/**
 * Resolve the drawing time for a كمّل رسمتي turn.
 * `artistCount` excludes the final guesser, who never draws.
 */
export function kammilDrawMs(artistCount: number): number {
  const table = KAMMIL.drawMsByArtistCount;
  const keys = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);

  let chosen: number = KAMMIL.drawMsFloor;
  for (const key of keys) {
    if (artistCount >= key) {
      chosen = table[key] ?? chosen;
    }
  }
  return Math.max(chosen, KAMMIL.drawMsFloor);
}

/**
 * Decide whether the drawing stage of المزوّر may end now.
 * Kept as a pure function so it is trivially unit-testable and so the rule
 * can be swapped per-room without branching inside UI code.
 */
export function canEndDrawing(params: {
  rule: ReadyToVoteRule;
  requesterId: string;
  hostId: string;
  readyPlayerIds: readonly string[];
  connectedPlayerCount: number;
}): boolean {
  const { rule, requesterId, hostId, readyPlayerIds, connectedPlayerCount } = params;

  switch (rule) {
    case 'any_player':
      return true;
    case 'host_only':
      return requesterId === hostId;
    case 'majority': {
      const votes = new Set(readyPlayerIds).add(requesterId).size;
      return votes > connectedPlayerCount / 2;
    }
  }
}
