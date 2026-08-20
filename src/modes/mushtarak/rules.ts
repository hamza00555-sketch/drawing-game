/**
 * الرسم المشترك — permissions.
 */

import type { MushtarakPhase } from './machine';

export {
  MUSHTARAK,
  COMBO_PROMPTS,
  pickCombo,
  pickArtistPair,
  scoreMushtarakRound,
  scoreMushtarakDuoRound,
} from '../../../shared/mushtarak';
export type {
  ComboPrompt,
  MushtarakRoundInput,
  MushtarakScoreDelta,
} from '../../../shared/mushtarak';

export interface MushtarakState {
  phase: MushtarakPhase;
  artistIds: string[];
  guesserIds: string[];
  isDuo?: boolean;
  /** Duo only: whose turn it is right now. */
  currentPlayerId?: string;
}

/**
 * Both artists draw at once in the group ruleset — the only mode where
 * `canDraw` is true for more than one player simultaneously. Duo replaces
 * that with strict alternation: exactly one of the two may draw at a time.
 */
export function canDraw(state: MushtarakState, playerId: string): boolean {
  if (state.phase !== 'draw') return false;
  if (state.isDuo) return state.currentPlayerId === playerId;
  return state.artistIds.includes(playerId);
}

/**
 * Who may guess. Inverted in Duo: the two artists are normally the only
 * players barred from guessing, but in Duo they are the only players there
 * are — and each names their partner's half.
 */
export function canGuess(state: MushtarakState, playerId: string): boolean {
  if (state.phase !== 'guess') return false;
  if (state.isDuo) return state.artistIds.includes(playerId);
  return !state.artistIds.includes(playerId);
}

/**
 * An artist only ever sees their OWN half, until the reveal. This holds in
 * Duo too — the split is exactly what the players are guessing at the end, so
 * showing anyone the whole prompt early would give the answer away.
 */
export function visiblePromptPart(
  state: MushtarakState,
  playerId: string,
  parts: { partA?: string; partB?: string; full?: string },
): string | undefined {
  if (state.phase === 'reveal' || state.phase === 'result') return parts.full;

  const index = state.artistIds.indexOf(playerId);
  if (index === 0) return parts.partA;
  if (index === 1) return parts.partB;
  return undefined;
}

/**
 * Whether this artist may still send the "فهمتك" signal.
 *
 * One use each, per round. It is the only communication channel the two artists
 * have, and making it unlimited would turn it into a chat — which would remove
 * the misunderstanding the mode runs on. In Duo there is no misunderstanding to
 * signal (both players already know the prompt), so the signal is off entirely.
 */
export function canSendGotYou(
  state: MushtarakState,
  playerId: string,
  usedBy: readonly string[],
  usesAllowed: number,
): boolean {
  if (state.isDuo) return false;
  if (state.phase !== 'draw') return false;
  if (!state.artistIds.includes(playerId)) return false;

  const used = usedBy.filter((id) => id === playerId).length;
  return used < usesAllowed;
}

/** Duo only: has the last of the fixed number of quick turns just finished? */
export function isLastDuoTurn(turnIndex: number, totalSwaps: number): boolean {
  return turnIndex + 1 >= totalSwaps;
}
