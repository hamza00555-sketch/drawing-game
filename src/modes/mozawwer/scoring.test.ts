import { describe, expect, it } from 'vitest';
import { applyScores, scoreMozawwerRound } from './scoring';
import { MOZAWWER } from '../../config/balance';
import { pickWord, MOZAWWER_WORDS } from './content';

const players = ['p1', 'p2', 'p3', 'p4'];

describe('scoreMozawwerRound', () => {
  it('pays correct voters and the group when the impostor is caught', () => {
    const delta = scoreMozawwerRound({
      impostorId: 'p4',
      votes: { p1: 'p4', p2: 'p4', p3: 'p2' },
      playerIds: players,
      caught: true,
      impostorGuessedWord: false,
    });

    const { correctVote, groupCaughtImpostor } = MOZAWWER.scores;
    expect(delta.p1).toBe(correctVote + groupCaughtImpostor);
    expect(delta.p2).toBe(correctVote + groupCaughtImpostor);
    // p3 voted wrongly but still shares the group win.
    expect(delta.p3).toBe(groupCaughtImpostor);
    expect(delta.p4).toBeUndefined();
  });

  it('still pays an individually correct vote when the room got it wrong', () => {
    // Being right should never be worthless because everyone else was wrong.
    const delta = scoreMozawwerRound({
      impostorId: 'p4',
      votes: { p1: 'p4', p2: 'p3', p3: 'p2' },
      playerIds: players,
      caught: false,
      impostorGuessedWord: false,
    });

    expect(delta.p1).toBe(MOZAWWER.scores.correctVote);
    expect(delta.p4).toBe(MOZAWWER.scores.impostorSurvived);
  });

  it('rewards a caught impostor who names the word', () => {
    const delta = scoreMozawwerRound({
      impostorId: 'p4',
      votes: { p1: 'p4', p2: 'p4', p3: 'p4' },
      playerIds: players,
      caught: true,
      impostorGuessedWord: true,
    });

    expect(delta.p4).toBe(MOZAWWER.scores.impostorGuessedWord);
  });

  it('never pays the impostor for voting', () => {
    const delta = scoreMozawwerRound({
      impostorId: 'p4',
      // The impostor voting for themselves must not be a points exploit.
      votes: { p4: 'p4' },
      playerIds: players,
      caught: false,
      impostorGuessedWord: false,
    });

    expect(delta.p4).toBe(MOZAWWER.scores.impostorSurvived);
  });

  it('surviving beats being caught, from the impostor seat', () => {
    const survived = scoreMozawwerRound({
      impostorId: 'p4',
      votes: {},
      playerIds: players,
      caught: false,
      impostorGuessedWord: false,
    });
    const caughtButGuessed = scoreMozawwerRound({
      impostorId: 'p4',
      votes: {},
      playerIds: players,
      caught: true,
      impostorGuessedWord: true,
    });

    expect(survived.p4 ?? 0).toBeGreaterThan(caughtButGuessed.p4 ?? 0);
  });
});

describe('applyScores', () => {
  it('accumulates across rounds without mutating the input', () => {
    const before = { p1: 3, p2: 1 };
    const after = applyScores(before, { p1: 2, p3: 5 });

    expect(after).toEqual({ p1: 5, p2: 1, p3: 5 });
    expect(before).toEqual({ p1: 3, p2: 1 });
  });
});

describe('pickWord', () => {
  it('avoids words the room already used', () => {
    const used = MOZAWWER_WORDS.slice(0, MOZAWWER_WORDS.length - 1).map((w) => w.word);
    const picked = pickWord(used, () => 0);
    expect(picked.word).toBe(MOZAWWER_WORDS[MOZAWWER_WORDS.length - 1]?.word);
  });

  it('repeats rather than refusing once the list is exhausted', () => {
    const all = MOZAWWER_WORDS.map((w) => w.word);
    expect(pickWord(all, () => 0.5)).toBeDefined();
  });

  it('never indexes past the end when random returns 1', () => {
    expect(pickWord([], () => 0.999999)).toBeDefined();
    expect(pickWord([], () => 1)).toBeDefined();
  });
});

describe('word bank', () => {
  it('has no duplicates', () => {
    const words = MOZAWWER_WORDS.map((w) => w.word);
    expect(new Set(words).size).toBe(words.length);
  });

  it('is big enough that a long session does not repeat immediately', () => {
    expect(MOZAWWER_WORDS.length).toBeGreaterThanOrEqual(40);
  });
});
