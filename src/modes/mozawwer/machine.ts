/**
 * المزوّر — state machine.
 *
 * One shared drawing passes around the room. Everyone knows the word except one
 * player, the impostor, who knows only that they are the impostor. They watch
 * what others add and try to blend in.
 *
 * Phases:
 *
 *   setup          server picks the word, the impostor and the turn order
 *   roleReveal     each player privately reads their own secret
 *   draw           turns pass around one canvas until the room ends it
 *   vote           everyone names who they think the impostor is
 *   reveal         the unmasking
 *   impostorGuess  caught impostor gets one shot at naming the word
 *   result         scores
 *
 * `reveal` goes to `impostorGuess` only when the impostor was caught. If they
 * survived the vote there is nothing left to guess for — they already won — so
 * it goes straight to `result`.
 */

import { defineMachine } from '../../engine/fsm';

export type MozawwerPhase =
  | 'setup'
  | 'roleReveal'
  | 'draw'
  | 'vote'
  | 'reveal'
  | 'impostorGuess'
  | 'result';

export const mozawwerMachine = defineMachine<MozawwerPhase>({
  initial: 'setup',
  phases: {
    setup: {
      next: ['roleReveal'],
      timed: false,
      describe: 'Server assigns word, impostor and turn order',
    },
    roleReveal: {
      next: ['draw'],
      timed: true,
      describe: 'Each player privately reads their own role',
    },
    draw: {
      next: ['vote'],
      timed: true,
      describe: 'Turns pass around one shared canvas',
    },
    vote: {
      next: ['reveal'],
      timed: true,
      describe: 'Everyone names a suspect',
    },
    reveal: {
      // Caught -> the impostor gets a last chance. Survived -> straight to
      // scores; there is nothing left for them to play for.
      next: ['impostorGuess', 'result'],
      timed: true,
      describe: 'The unmasking',
    },
    impostorGuess: {
      next: ['result'],
      timed: true,
      describe: 'Caught impostor names the word to claw points back',
    },
    result: {
      next: [],
      timed: false,
      describe: 'Scores',
    },
  },
});

/** Phases in which strokes may be written. Used by rules and by the UI. */
export const DRAWING_PHASES: readonly MozawwerPhase[] = ['draw'];
