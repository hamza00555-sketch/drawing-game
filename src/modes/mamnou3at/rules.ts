/**
 * الممنوعات — permissions and guess handling.
 */

import { isCorrectGuess } from '../../../shared/mozawwer';
import type { MamnouPhase } from './machine';

export {
  MAMNOU3AT,
  TABOO_WORDS,
  pickTaboo,
  letterHint,
  scoreMamnouRound,
} from '../../../shared/mamnou3at';
export type { TabooEntry, MamnouRoundInput, MamnouScoreDelta } from '../../../shared/mamnou3at';

export interface MamnouState {
  phase: MamnouPhase;
  artistId: string;
  /** Everyone except the artist. */
  guesserIds: string[];
}

export function canDraw(state: MamnouState, playerId: string): boolean {
  return state.phase === 'draw' && state.artistId === playerId;
}

/** The artist obviously cannot guess their own word. */
export function canGuess(state: MamnouState, playerId: string): boolean {
  return state.phase === 'draw' && state.artistId !== playerId;
}

/** Only the artist sees the word and the forbidden list, until results. */
export function canSeeWord(state: MamnouState, playerId: string): boolean {
  if (state.phase === 'result') return true;
  return state.artistId === playerId;
}

export interface GuessRecord {
  id: string;
  playerId: string;
  text: string;
  at: number;
  correct?: boolean;
}

/**
 * Correct guessers, in the order they got it, without duplicates.
 *
 * A player who guesses correctly twice must not occupy two ranked payouts, and
 * their FIRST correct guess is the one that counts — a later one would unfairly
 * demote them behind someone slower.
 */
export function rankCorrectGuessers(
  guesses: readonly GuessRecord[],
  word: string,
): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const guess of [...guesses].sort((a, b) => a.at - b.at)) {
    if (!isCorrectGuess(guess.text, word)) continue;
    if (seen.has(guess.playerId)) continue;

    seen.add(guess.playerId);
    ordered.push(guess.playerId);
  }

  return ordered;
}

/**
 * Whether the round can end early: everyone who could guess already has.
 * Sitting through the rest of a 75-second timer once the room has finished is
 * dead air, not tension.
 */
export function everyoneGuessed(
  state: MamnouState,
  correctGuesserIds: readonly string[],
): boolean {
  return (
    state.guesserIds.length > 0 &&
    state.guesserIds.every((id) => correctGuesserIds.includes(id))
  );
}

export { isCorrectGuess };
