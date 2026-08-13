/**
 * كانت إيش؟ — permissions.
 *
 * Every function here exists to enforce one thing: a player may see exactly one
 * link, the one that feeds their turn.
 */

import type { KanatEshPhase } from './machine';

export {
  KANAT_ESH,
  SEED_SENTENCES,
  pickSeed,
  chainLength,
  linkTypeAt,
  chainAssignments,
  readableLinkIndex,
  scoreKanatEshRound,
} from '../../../shared/kanatEsh';
export type {
  ChainLink,
  LinkType,
  KanatEshRoundInput,
  KanatEshScoreDelta,
} from '../../../shared/kanatEsh';

import { linkTypeAt, readableLinkIndex } from '../../../shared/kanatEsh';

export interface KanatEshState {
  phase: KanatEshPhase;
  /** Author per link index. Index 0 is the seed and has no author. */
  authorByIndex: Record<number, string>;
  /** The link currently being authored. */
  currentIndex: number;
  totalLinks: number;
}

export function currentAuthorId(state: KanatEshState): string | undefined {
  return state.authorByIndex[state.currentIndex];
}

export function isMyTurn(state: KanatEshState, playerId: string): boolean {
  return state.phase === 'turn' && currentAuthorId(state) === playerId;
}

/** Whether this turn is drawn or written. */
export function currentLinkType(state: KanatEshState) {
  return linkTypeAt(state.currentIndex);
}

/**
 * Whether a player may read a given link.
 *
 * During the chain: only the single link feeding their own turn, and only on
 * their turn. After the reveal: everything.
 *
 * This mirrors the security rule exactly. Both exist because either alone would
 * be a single point of failure for the mode's core secret.
 */
export function canReadLink(
  state: KanatEshState,
  playerId: string,
  linkIndex: number,
): boolean {
  if (state.phase === 'reveal' || state.phase === 'result') return true;
  if (!isMyTurn(state, playerId)) return false;

  return linkIndex === readableLinkIndex(state.currentIndex);
}

export function isChainComplete(state: KanatEshState): boolean {
  return state.currentIndex >= state.totalLinks;
}
