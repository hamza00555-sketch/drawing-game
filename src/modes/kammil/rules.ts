/**
 * كمّل رسمتي — permissions and turn progression.
 *
 * Pure functions, shared between the screens and the Cloud Function that drives
 * the phases, so the two cannot disagree about whose turn it is.
 */

import { KAMMIL, kammilDrawMs } from '../../../shared/kammil';
import type { KammilPhase } from './machine';

export {
  KAMMIL,
  kammilDrawMs,
  assignKammilRoles,
  scoreKammilRound,
} from '../../../shared/kammil';
export type { KammilRoundInput, KammilScoreDelta } from '../../../shared/kammil';

export interface KammilState {
  phase: KammilPhase;
  /** Draw order. Excludes the guesser, who never draws. */
  artistIds: string[];
  guesserId: string;
  /** Index into artistIds. Does NOT wrap — each artist draws exactly once. */
  turnIndex: number;
}

export function currentArtistId(state: KammilState): string | undefined {
  return state.artistIds[state.turnIndex];
}

/**
 * Whether this player's pen is live.
 *
 * False during `countdown` by design: the artist can see the drawing and the
 * word, but cannot touch the canvas. Those three seconds are for reading the
 * situation, and letting anyone draw in them would hand the fastest reactions a
 * permanent advantage.
 */
export function canDraw(state: KammilState, playerId: string): boolean {
  return state.phase === 'turn' && currentArtistId(state) === playerId;
}

/** The guesser must never see the word — not even in a phase that shows it. */
export function canSeeWord(state: KammilState, playerId: string): boolean {
  if (playerId === state.guesserId) return state.phase === 'reveal' || state.phase === 'result';
  return true;
}

export function isLastArtist(state: KammilState): boolean {
  return state.turnIndex >= state.artistIds.length - 1;
}

/** What happens when a turn's timer expires. */
export function afterTurn(state: KammilState): {
  phase: KammilPhase;
  turnIndex: number;
} {
  if (isLastArtist(state)) {
    return { phase: 'guess', turnIndex: state.turnIndex };
  }
  return { phase: 'countdown', turnIndex: state.turnIndex + 1 };
}

/** Turn length for this room, derived from the number of artists. */
export function turnDurationMs(state: KammilState): number {
  return kammilDrawMs(state.artistIds.length);
}

/**
 * Countdown beat currently showing: 3, 2, 1 — or 0 once it is over.
 * Derived from remaining time so every device shows the same number, rather
 * than each running its own interval and drifting apart.
 */
export function countdownBeat(remainingMs: number): number {
  if (remainingMs <= 0) return 0;
  return Math.min(3, Math.ceil(remainingMs / 1000));
}

export const COUNTDOWN_MS = KAMMIL.countdownMs;
