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
}

/**
 * Both artists draw at once — this is the only mode where `canDraw` is true for
 * more than one player simultaneously.
 */
export function canDraw(state: MushtarakState, playerId: string): boolean {
  return state.phase === 'draw' && state.artistIds.includes(playerId);
}

export function canGuess(state: MushtarakState, playerId: string): boolean {
  return state.phase === 'guess' && !state.artistIds.includes(playerId);
}

/** An artist only ever sees their OWN half, until the reveal. */
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
 * the misunderstanding the mode runs on.
 */
export function canSendGotYou(
  state: MushtarakState,
  playerId: string,
  usedBy: readonly string[],
  usesAllowed: number,
): boolean {
  if (state.phase !== 'draw') return false;
  if (!state.artistIds.includes(playerId)) return false;

  const used = usedBy.filter((id) => id === playerId).length;
  return used < usesAllowed;
}
