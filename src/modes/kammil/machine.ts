/**
 * كمّل رسمتي — state machine.
 *
 * The drawing turn is split into two phases rather than one, because the pen
 * must be LOCKED while the artist reads the drawing and the word:
 *
 *   countdown  artist sees the canvas and the word, pen disabled, 3-2-1
 *   turn       pen unlocks automatically, then locks again when time expires
 *
 * `turn` loops back to `countdown` for the next artist. Nobody presses a finish
 * button — the turn ending is the timer, which is what keeps every artist under
 * the same pressure and stops a fast player from stealing extra seconds.
 *
 * After the last artist, the guesser — who never drew and never saw the word —
 * gets the finished mess and one question: وش ذا؟
 *
 * Duo (two players) adds one more phase, `extend`: a wrong guess is not
 * necessarily the end there — the artist gets one short bonus window to add
 * to the drawing before the guesser tries again, capped at one use per round
 * so it stays a bonus, not a second full turn.
 */

import { defineMachine } from '../../engine/fsm';

export type KammilPhase =
  | 'setup'
  | 'countdown'
  | 'turn'
  | 'guess'
  | 'extend'
  | 'reveal'
  | 'result';

export const kammilMachine = defineMachine<KammilPhase>({
  initial: 'setup',
  phases: {
    setup: {
      next: ['countdown'],
      timed: false,
      describe: 'Server picks the word, the artists and the guesser',
    },
    countdown: {
      next: ['turn'],
      timed: true,
      describe: 'Artist sees the drawing and the word with the pen locked',
    },
    turn: {
      // Loops for the next artist, or moves on once every artist has drawn.
      next: ['countdown', 'guess'],
      timed: true,
      describe: 'Pen is live for a few seconds, then locks automatically',
    },
    guess: {
      next: ['reveal', 'extend'],
      timed: true,
      describe: 'The guesser names whatever the room produced',
    },
    extend: {
      next: ['guess'],
      timed: true,
      describe: 'Duo only: the guesser was wrong, artist gets one short bonus window',
    },
    reveal: {
      next: ['result'],
      timed: true,
      describe: 'Word, guess, and the replay of how the drawing grew',
    },
    result: {
      next: [],
      timed: false,
      describe: 'Scores',
    },
  },
});
