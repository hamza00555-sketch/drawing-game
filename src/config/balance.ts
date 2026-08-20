/**
 * وش ذا؟ — Game Balance
 * -----------------------------------------------------------------------------
 * Every tunable number in the game lives here. No component, no mode machine
 * and no Cloud Function may hardcode a duration, a score value or a rule.
 *
 * These are the DEFAULTS. A room stores only the values its host actually
 * changed from the settings screen, and the two are merged at round start by
 * `resolveSettings` in shared/tunables.ts — which also decides which of these
 * may be overridden at all, and clamps each one to a sane range.
 *
 * Everything here is expected to change after the first real playtest.
 */

import { MOZAWWER, type ReadyToVoteRule } from '../../shared/mozawwer';
import { KAMMIL, kammilDrawMs } from '../../shared/kammil';
import { MAMNOU3AT } from '../../shared/mamnou3at';
import { MUSHTARAK } from '../../shared/mushtarak';
import { KANAT_ESH } from '../../shared/kanatEsh';

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

/*
 * The remaining three modes live in shared/ for the same reason: the trusted
 * server logic reads the very same objects. These used to be re-declared here
 * instead, and had already drifted — this file's الممنوعات was missing
 * `briefMs` and every Duo value, so anything reading a default from here got a
 * different answer than the server did.
 */
export { MAMNOU3AT, MUSHTARAK, KANAT_ESH };

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
