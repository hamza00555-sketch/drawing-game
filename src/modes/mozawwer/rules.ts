/**
 * المزوّر — permissions and round progression.
 *
 * Pure functions only. Every question a screen or a Cloud Function needs to ask
 * about this mode is answered here, so the same logic runs on both sides and
 * cannot drift.
 */

import { canEndDrawing } from '../../config/balance';
import { MOZAWWER, type ReadyToVoteRule } from '../../../shared/mozawwer';
import type { MozawwerPhase } from './machine';

export interface MozawwerState {
  phase: MozawwerPhase;
  /** Play order, fixed at setup. Only connected players are included. */
  turnOrder: string[];
  /** Index into turnOrder. Wraps, so the drawing can go round more than once. */
  turnIndex: number;
  /** Turns completed so far, across the whole round. */
  turnsTaken: number;
  /** Players who have asked to end the drawing (used by the majority rule). */
  readyToVote: string[];
}

export function currentPlayerId(state: MozawwerState): string | undefined {
  if (state.turnOrder.length === 0) return undefined;
  return state.turnOrder[state.turnIndex % state.turnOrder.length];
}

/** Whether this player may put strokes on the canvas right now. */
export function canDraw(state: MozawwerState, playerId: string): boolean {
  return state.phase === 'draw' && currentPlayerId(state) === playerId;
}

/**
 * Whether the "الرسمة جاهزة" button should even be offered.
 *
 * Hidden for the first few turns so a round cannot end before the drawing has
 * anything in it — and, more importantly, before the impostor has had to
 * contribute at all.
 */
export function canOfferReady(state: MozawwerState, minTurns = MOZAWWER.minTurnsBeforeReady): boolean {
  return state.phase === 'draw' && state.turnsTaken >= minTurns;
}

/**
 * Whether the drawing stage may end now.
 *
 * Delegates the rule itself to balance config, because which players may end it
 * is a live playtest question: `any_player` is the most fun, but it hands the
 * impostor a way to cut the round short before their weak contribution is
 * exposed. See ReadyToVoteRule.
 */
export function canEndDrawingNow(params: {
  state: MozawwerState;
  requesterId: string;
  hostId: string;
  connectedPlayerCount: number;
  rule?: ReadyToVoteRule;
}): boolean {
  const { state, requesterId, hostId, connectedPlayerCount } = params;
  const rule = params.rule ?? MOZAWWER.readyToVoteRule;

  if (!canOfferReady(state)) return false;

  return canEndDrawing({
    rule,
    requesterId,
    hostId,
    readyPlayerIds: state.readyToVote,
    connectedPlayerCount,
  });
}

/** Hard ceiling so a room that never presses the button still finishes. */
export function mustEndDrawing(state: MozawwerState, maxTurns = MOZAWWER.maxTurns): boolean {
  return state.turnsTaken >= maxTurns;
}

/** Advance to the next artist. Wraps around the order. */
export function nextTurn(state: MozawwerState): MozawwerState {
  return {
    ...state,
    turnIndex: (state.turnIndex + 1) % Math.max(1, state.turnOrder.length),
    turnsTaken: state.turnsTaken + 1,
  };
}

/**
 * Vote tallying and guess normalisation live in shared/mozawwer.ts: the server
 * tallies the real votes and judges the real guess, and the client must predict
 * both identically.
 */
export { tallyVotes, normalizeGuess, isCorrectGuess } from '../../../shared/mozawwer';
