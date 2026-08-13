/**
 * كانت إيش؟ — state machine.
 *
 * The chain is one repeating turn: a player reads the single link before theirs
 * and produces the next one, alternating drawing and text. `turn` loops back to
 * itself until the chain is full, then everything is revealed at once.
 *
 * There is no per-turn reveal. Showing anything before the end would leak the
 * chain to players who still have turns to take, and the blindness is the mode.
 */

import { defineMachine } from '../../engine/fsm';

export type KanatEshPhase = 'setup' | 'turn' | 'reveal' | 'result';

export const kanatEshMachine = defineMachine<KanatEshPhase>({
  initial: 'setup',
  phases: {
    setup: {
      next: ['turn'],
      timed: false,
      describe: 'Server picks the seed sentence and assigns the chain',
    },
    turn: {
      // Loops for each link, then opens the full reveal.
      next: ['turn', 'reveal'],
      timed: true,
      describe: 'One player reads only the previous link and produces the next',
    },
    reveal: {
      next: ['result'],
      timed: false,
      describe: 'The Final Journey Poster — the whole chain, in order',
    },
    result: { next: [], timed: false, describe: 'Scores' },
  },
});
