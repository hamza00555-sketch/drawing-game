/**
 * الممنوعات — state machine.
 *
 * Simplest arc in the game: one artist, one timed drawing phase during which
 * everyone else guesses freely, then results.
 *
 * There is no separate guessing phase, because guessing happens WHILE the
 * drawing is being made. That simultaneity is the mode — the artist watches
 * wrong guesses arrive and has to correct course without using the one feature
 * that would fix it.
 *
 * No replay either: nothing grew here. One person drew one picture, and the
 * finished image already tells the whole story.
 */

import { defineMachine } from '../../engine/fsm';

export type MamnouPhase = 'setup' | 'brief' | 'draw' | 'result';

export const mamnouMachine = defineMachine<MamnouPhase>({
  initial: 'setup',
  phases: {
    setup: {
      next: ['brief'],
      timed: false,
      describe: 'Server picks the artist, the word and its forbidden features',
    },
    brief: {
      next: ['draw'],
      timed: true,
      describe: 'Artist privately reads the word and what they may not draw',
    },
    draw: {
      next: ['result'],
      timed: true,
      describe: 'Artist draws while everyone else guesses freely',
    },
    result: {
      next: [],
      timed: false,
      describe: 'Who got it, in what order, and the scores',
    },
  },
});
