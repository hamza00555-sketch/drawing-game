/**
 * المزوّر — scoring.
 *
 * The implementation lives in shared/mozawwer.ts because the Cloud Function
 * that actually awards the points compiles the same file. A scoring rule that
 * differed between the screen and the server would read to players as the game
 * lying to them.
 */

export { scoreMozawwerRound, applyScores } from '../../../shared/mozawwer';
export type { MozawwerRoundInput, ScoreDelta } from '../../../shared/mozawwer';
