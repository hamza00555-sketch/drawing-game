/**
 * الرسم المشترك — state machine.
 *
 * Both artists draw at the same time, so there is no turn loop here. One
 * simultaneous drawing phase, then guessing, then a short replay that separates
 * the two contributions by colour.
 *
 * Guessing is its OWN phase rather than running alongside the drawing, unlike
 * الممنوعات. Here the picture only makes sense once both halves are finished —
 * guessing early would mostly produce guesses at half an idea.
 */

import { defineMachine } from '../../engine/fsm';

export type MushtarakPhase = 'setup' | 'brief' | 'draw' | 'guess' | 'reveal' | 'result';

export const mushtarakMachine = defineMachine<MushtarakPhase>({
  initial: 'setup',
  phases: {
    setup: {
      next: ['brief'],
      timed: false,
      describe: 'Server picks the pair and splits the prompt between them',
    },
    brief: {
      next: ['draw'],
      timed: true,
      describe: 'Each artist privately reads only their own half',
    },
    draw: {
      next: ['guess'],
      timed: true,
      describe: 'Both artists draw the same canvas simultaneously',
    },
    guess: {
      next: ['reveal'],
      timed: true,
      describe: 'Everyone else names the combination',
    },
    reveal: {
      next: ['result'],
      timed: true,
      describe: 'The full prompt, and a replay showing who drew what',
    },
    result: { next: [], timed: false, describe: 'Scores' },
  },
});
