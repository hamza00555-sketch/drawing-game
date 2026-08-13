/**
 * Re-export of the shared المزوّر logic for the Cloud Functions build.
 *
 * The server MUST use the same word bank, the same vote tally, the same guess
 * normalisation and the same scoring as the client predicts. Importing the one
 * file is what guarantees that; a copy here would be free to drift, and a
 * scoring rule that differs between screen and server reads to players as the
 * game lying to them.
 */

export {
  MOZAWWER,
  MOZAWWER_WORDS,
  pickWord,
  tallyVotes,
  normalizeGuess,
  isCorrectGuess,
  scoreMozawwerRound,
  applyScores,
} from '../../shared/mozawwer';
export type { ReadyToVoteRule, WordEntry, MozawwerRoundInput, ScoreDelta } from '../../shared/mozawwer';
