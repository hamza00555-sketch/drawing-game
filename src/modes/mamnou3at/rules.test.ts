import { describe, expect, it } from 'vitest';
import { mamnouMachine } from './machine';
import {
  MAMNOU3AT,
  TABOO_WORDS,
  canDraw,
  canGuess,
  canSeeWord,
  everyoneGuessed,
  letterHint,
  pickTaboo,
  rankCorrectGuessers,
  scoreMamnouDuoRound,
  scoreMamnouRound,
  type GuessRecord,
  type MamnouState,
} from './rules';

function state(overrides: Partial<MamnouState> = {}): MamnouState {
  return {
    phase: 'draw',
    artistId: 'a1',
    guesserIds: ['g1', 'g2', 'g3'],
    ...overrides,
  };
}

function guess(playerId: string, text: string, at: number): GuessRecord {
  return { id: `${playerId}-${at}`, playerId, text, at };
}

describe('mamnou machine', () => {
  it('is well-formed', () => {
    expect(() => mamnouMachine.validate()).not.toThrow();
  });

  it('has no separate guessing phase — guessing happens during drawing', () => {
    expect(mamnouMachine.canTransition('draw', 'result')).toBe(true);
    expect(mamnouMachine.allPhases()).not.toContain('guess');
  });
});

describe('permissions', () => {
  it('only the artist draws, and only the others guess', () => {
    expect(canDraw(state(), 'a1')).toBe(true);
    expect(canDraw(state(), 'g1')).toBe(false);
    expect(canGuess(state(), 'g1')).toBe(true);
    expect(canGuess(state(), 'a1')).toBe(false);
  });

  it('hides the word from guessers until results', () => {
    expect(canSeeWord(state(), 'g1')).toBe(false);
    expect(canSeeWord(state(), 'a1')).toBe(true);
    expect(canSeeWord(state({ phase: 'result' }), 'g1')).toBe(true);
  });
});

describe('letterHint', () => {
  it('gives one slot per letter', () => {
    expect(letterHint('قطة')).toBe('_ _ _');
  });

  it('preserves word boundaries in multi-word answers', () => {
    // "كرة قدم" must not look like a single seven-letter word.
    const hint = letterHint('كرة قدم');
    expect(hint).toContain('   ');
    expect(hint.replace(/[\s]/g, '')).toHaveLength(6);
  });

  it('never leaks an actual letter', () => {
    for (const entry of TABOO_WORDS) {
      const hint = letterHint(entry.word);
      for (const char of entry.word.replace(/\s/g, '')) {
        expect(hint).not.toContain(char);
      }
    }
  });
});

describe('rankCorrectGuessers', () => {
  const word = 'قطة';

  it('orders by who got it first', () => {
    const ranked = rankCorrectGuessers(
      [guess('g2', 'كلب', 10), guess('g1', 'قطة', 20), guess('g3', 'قطه', 15)],
      word,
    );
    expect(ranked).toEqual(['g3', 'g1']);
  });

  it('counts a player once, at their first correct guess', () => {
    // A second correct guess must not take another ranked payout, nor demote
    // the player behind someone who was actually slower.
    const ranked = rankCorrectGuessers(
      [guess('g1', 'قطة', 10), guess('g1', 'قطة', 30), guess('g2', 'قطة', 20)],
      word,
    );
    expect(ranked).toEqual(['g1', 'g2']);
  });

  it('ignores wrong guesses entirely', () => {
    expect(rankCorrectGuessers([guess('g1', 'كلب', 10)], word)).toEqual([]);
  });
});

describe('scoreMamnouRound', () => {
  it('pays the ranked tiers in order', () => {
    const delta = scoreMamnouRound({
      artistId: 'a1',
      correctGuesserIds: ['g1', 'g2', 'g3'],
    });

    const [first, second, third] = MAMNOU3AT.scores.guessRank;
    expect(delta.g1).toBe(first);
    expect(delta.g2).toBe(second);
    expect(delta.g3).toBe(third);
  });

  it('pays late guessers the last tier rather than nothing', () => {
    const delta = scoreMamnouRound({
      artistId: 'a1',
      correctGuesserIds: ['g1', 'g2', 'g3', 'g4', 'g5'],
    });
    const last = MAMNOU3AT.scores.guessRank[MAMNOU3AT.scores.guessRank.length - 1];
    expect(delta.g5).toBe(last);
  });

  it('rewards the artist per player who understood the drawing', () => {
    const delta = scoreMamnouRound({ artistId: 'a1', correctGuesserIds: ['g1', 'g2'] });
    expect(delta.a1).toBe(2 * MAMNOU3AT.scores.artistPerCorrectGuess);
  });

  it('gives the artist nothing when nobody got it', () => {
    const delta = scoreMamnouRound({ artistId: 'a1', correctGuesserIds: [] });
    expect(delta.a1).toBeUndefined();
  });
});

describe('everyoneGuessed', () => {
  it('ends the round early once the whole room has it', () => {
    expect(everyoneGuessed(state(), ['g1', 'g2', 'g3'])).toBe(true);
    expect(everyoneGuessed(state(), ['g1', 'g2'])).toBe(false);
  });

  it('is false for a round with no guessers at all', () => {
    expect(everyoneGuessed(state({ guesserIds: [] }), [])).toBe(false);
  });
});

// Who draws is now decided by the caller (nextInTurnCycle, tested in
// src/engine/turnCycle.test.ts) — mamnou3at no longer picks its own artist.

describe('scoreMamnouDuoRound', () => {
  it('pays close to the max when the guess lands right away', () => {
    const delta = scoreMamnouDuoRound({
      artistId: 'a1',
      guesserId: 'g1',
      correct: true,
      guessedAtMs: 0,
      drawMs: 35_000,
    });
    expect(delta.g1).toBe(MAMNOU3AT.duo.scores.maxGuesserPoints);
    expect(delta.a1).toBe(MAMNOU3AT.duo.scores.artistPointsOnCorrect);
  });

  it('pays close to the minimum when the guess lands at the buzzer', () => {
    const delta = scoreMamnouDuoRound({
      artistId: 'a1',
      guesserId: 'g1',
      correct: true,
      guessedAtMs: 35_000,
      drawMs: 35_000,
    });
    expect(delta.g1).toBe(MAMNOU3AT.duo.scores.minGuesserPoints);
  });

  it('rewards speed: an earlier correct guess always scores at least as much', () => {
    const early = scoreMamnouDuoRound({
      artistId: 'a1',
      guesserId: 'g1',
      correct: true,
      guessedAtMs: 5_000,
      drawMs: 35_000,
    });
    const late = scoreMamnouDuoRound({
      artistId: 'a1',
      guesserId: 'g1',
      correct: true,
      guessedAtMs: 30_000,
      drawMs: 35_000,
    });
    expect(early.g1 as number).toBeGreaterThan(late.g1 as number);
  });

  it('gives nobody anything on a miss — no consolation award today', () => {
    const delta = scoreMamnouDuoRound({
      artistId: 'a1',
      guesserId: 'g1',
      correct: false,
      guessedAtMs: null,
      drawMs: 35_000,
    });
    expect(delta.g1).toBeUndefined();
    expect(delta.a1).toBeUndefined();
    expect(MAMNOU3AT.duo.scores.artistPointsOnFail).toBe(0);
  });
});

describe('taboo word bank', () => {
  it('gives every word a forbidden list of the obvious features', () => {
    for (const entry of TABOO_WORDS) {
      expect(entry.forbidden.length).toBeGreaterThanOrEqual(MAMNOU3AT.forbiddenCount);
    }
  });

  it('has no duplicate words', () => {
    const words = TABOO_WORDS.map((w) => w.word);
    expect(new Set(words).size).toBe(words.length);
  });

  it('avoids repeating words the room already used', () => {
    const used = TABOO_WORDS.slice(0, TABOO_WORDS.length - 1).map((w) => w.word);
    expect(pickTaboo(used, () => 0).word).toBe(TABOO_WORDS[TABOO_WORDS.length - 1]?.word);
  });
});
