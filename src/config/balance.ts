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

import { MOZAWWER, type ReadyToVoteRule } from '../../shared/mozawwer';
import { KAMMIL, kammilDrawMs } from '../../shared/kammil';

export const ROOM = {
  /**
   * The room-level floor: a room can exist and sit in the lobby with as few as
   * two people. Whether a given MODE can start at that size is a separate,
   * per-mode question — see `MODE_MIN_PLAYERS` in `ModeSelectScreen.tsx`.
   */
  minPlayers: 2,
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

/*
 * المزوّر balance lives in shared/mozawwer.ts because the Cloud Function needs
 * the same numbers. Imported and re-exported here so this file stays the one
 * place anyone looks for a tunable value.
 */
export { MOZAWWER };
export type { ReadyToVoteRule };

/*
 * كمّل رسمتي balance lives in shared/kammil.ts — the Cloud Function needs the
 * same turn lengths and score values.
 */
export { KAMMIL, kammilDrawMs };

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
