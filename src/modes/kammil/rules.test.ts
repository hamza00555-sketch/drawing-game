import { describe, expect, it } from 'vitest';
import { kammilMachine } from './machine';
import {
  KAMMIL,
  afterTurn,
  assignKammilRoles,
  canDraw,
  canSeeWord,
  countdownBeat,
  currentArtistId,
  isLastArtist,
  kammilDrawMs,
  nextPhaseAfterGuess,
  scoreKammilDuoRound,
  scoreKammilRound,
  turnDurationMs,
  type KammilState,
} from './rules';

function state(overrides: Partial<KammilState> = {}): KammilState {
  return {
    phase: 'turn',
    artistIds: ['p1', 'p2', 'p3'],
    guesserId: 'p4',
    turnIndex: 0,
    ...overrides,
  };
}

describe('kammil machine', () => {
  it('is well-formed', () => {
    expect(() => kammilMachine.validate()).not.toThrow();
  });

  it('loops turn back to countdown for the next artist', () => {
    expect(kammilMachine.canTransition('turn', 'countdown')).toBe(true);
    expect(kammilMachine.canTransition('turn', 'guess')).toBe(true);
  });

  it('never lets a turn start without its countdown', () => {
    // The locked-pen countdown is the fairness mechanism: skipping straight to
    // drawing would reward whoever reacts fastest rather than whoever draws.
    expect(kammilMachine.canTransition('setup', 'turn')).toBe(false);
    expect(kammilMachine.canTransition('countdown', 'guess')).toBe(false);
  });

  it('Duo: a wrong guess may route through one bonus window, never more', () => {
    expect(kammilMachine.canTransition('guess', 'extend')).toBe(true);
    expect(kammilMachine.canTransition('extend', 'guess')).toBe(true);
    // Extend must go back through a fresh guess, not straight to reveal —
    // that is what keeps it a bonus window and not a second full turn.
    expect(kammilMachine.canTransition('extend', 'reveal')).toBe(false);
    // Only reachable from a guess that was actually wrong.
    expect(kammilMachine.canTransition('turn', 'extend')).toBe(false);
    expect(kammilMachine.canTransition('countdown', 'extend')).toBe(false);
  });
});

describe('drawing permission', () => {
  it('only the current artist may draw, and only during the turn', () => {
    expect(canDraw(state(), 'p1')).toBe(true);
    expect(canDraw(state(), 'p2')).toBe(false);
    expect(canDraw(state({ phase: 'countdown' }), 'p1')).toBe(false);
  });

  it('the guesser can never draw', () => {
    expect(canDraw(state(), 'p4')).toBe(false);
  });

  it('Duo: the pen lights back up for the same artist during extend', () => {
    const duoState = state({
      phase: 'extend',
      artistIds: ['p1'],
      guesserId: 'p2',
      turnIndex: 0,
      isDuo: true,
    });
    expect(canDraw(duoState, 'p1')).toBe(true);
    expect(canDraw(duoState, 'p2')).toBe(false);
  });

  it('extend never lights the pen up outside Duo', () => {
    const nonDuoExtend = state({ phase: 'extend', isDuo: false });
    expect(canDraw(nonDuoExtend, 'p1')).toBe(false);
  });
});

describe('word visibility', () => {
  it('hides the word from the guesser until the reveal', () => {
    expect(canSeeWord(state({ phase: 'turn' }), 'p4')).toBe(false);
    expect(canSeeWord(state({ phase: 'guess' }), 'p4')).toBe(false);
    expect(canSeeWord(state({ phase: 'reveal' }), 'p4')).toBe(true);
  });

  it('shows it to artists throughout', () => {
    expect(canSeeWord(state({ phase: 'countdown' }), 'p1')).toBe(true);
    expect(canSeeWord(state({ phase: 'turn' }), 'p1')).toBe(true);
  });
});

describe('turn progression', () => {
  it('gives every artist exactly one turn, without wrapping', () => {
    let s = state();
    expect(currentArtistId(s)).toBe('p1');

    let next = afterTurn(s);
    expect(next.phase).toBe('countdown');
    s = { ...s, ...next };
    expect(currentArtistId(s)).toBe('p2');

    next = afterTurn(s);
    s = { ...s, ...next };
    expect(currentArtistId(s)).toBe('p3');

    // Last artist -> the guesser's turn, not back to p1.
    expect(isLastArtist(s)).toBe(true);
    expect(afterTurn(s).phase).toBe('guess');
  });
});

describe('turn length', () => {
  it('shortens as more artists join', () => {
    expect(kammilDrawMs(2)).toBeGreaterThan(kammilDrawMs(4));
  });

  it('never drops below the floor', () => {
    expect(kammilDrawMs(50)).toBeGreaterThanOrEqual(KAMMIL.drawMsFloor);
  });

  it('is derived from the artist count, not the room size', () => {
    // 3 artists + 1 guesser must use the 3-artist tier, not the 4-player one.
    expect(turnDurationMs(state())).toBe(kammilDrawMs(3));
  });
});

describe('countdownBeat', () => {
  it('counts 3, 2, 1 then zero', () => {
    expect(countdownBeat(3000)).toBe(3);
    expect(countdownBeat(2400)).toBe(3);
    expect(countdownBeat(1800)).toBe(2);
    expect(countdownBeat(600)).toBe(1);
    expect(countdownBeat(0)).toBe(0);
  });

  it('never shows more than 3, whatever the clock says', () => {
    expect(countdownBeat(99_000)).toBe(3);
  });
});

describe('assignKammilRoles', () => {
  // Who guesses is now decided by the caller (nextInTurnCycle, tested in
  // src/engine/turnCycle.test.ts) — this function's job is just turning that
  // choice into the rest of the round.
  it('excludes the guesser from the artists', () => {
    const { artistIds, guesserId } = assignKammilRoles(
      ['p1', 'p2', 'p3', 'p4'],
      'p1',
      () => 0,
    );
    expect(guesserId).toBe('p1');
    expect(artistIds.sort()).toEqual(['p2', 'p3', 'p4']);
    expect(artistIds).not.toContain(guesserId);
  });

  it('does not always draw in join order', () => {
    // Filtering the guesser out of the join-ordered list would silently
    // leave the remaining artists in join order — whoever connects first
    // would always draw first, every round.
    function sequence(...values: number[]): () => number {
      let i = 0;
      return () => values[Math.min(i++, values.length - 1)] as number;
    }

    const joinOrder = ['p1', 'p2', 'p3', 'p4', 'p5'];
    const a = assignKammilRoles(joinOrder, 'p1', sequence(0, 0, 0, 0));
    const b = assignKammilRoles(joinOrder, 'p1', sequence(0, 0.9, 0.9, 0.9));
    expect(a.guesserId).toBe(b.guesserId);
    expect(a.artistIds).not.toEqual(b.artistIds);
  });

  it('refuses a room too small to have both artists and a guesser', () => {
    expect(() => assignKammilRoles(['p1'], 'p1')).toThrowError();
  });

  it('accepts exactly two players — the Duo floor', () => {
    expect(() => assignKammilRoles(['p1', 'p2'], 'p1', () => 0)).not.toThrow();
    const { artistIds, guesserId } = assignKammilRoles(['p1', 'p2'], 'p2', () => 0);
    expect(guesserId).toBe('p2');
    expect(artistIds).toEqual(['p1']);
  });
});

describe('scoreKammilRound', () => {
  it('pays the guesser and every artist on success', () => {
    const delta = scoreKammilRound({
      artistIds: ['p1', 'p2'],
      guesserId: 'p3',
      correct: true,
    });

    expect(delta.p3).toBe(KAMMIL.scores.guesserCorrect);
    expect(delta.p1).toBe(KAMMIL.scores.artistsOnSuccess);
    expect(delta.p2).toBe(KAMMIL.scores.artistsOnSuccess);
  });

  it('still pays artists something on failure', () => {
    const delta = scoreKammilRound({
      artistIds: ['p1', 'p2'],
      guesserId: 'p3',
      correct: false,
    });

    expect(delta.p3).toBeUndefined();
    expect(delta.p1).toBe(KAMMIL.scores.artistsOnFailure);
  });

  it('rewards artists more when the drawing actually worked', () => {
    expect(KAMMIL.scores.artistsOnSuccess).toBeGreaterThan(KAMMIL.scores.artistsOnFailure);
  });
});

describe('nextPhaseAfterGuess — Duo only', () => {
  it('sends a wrong guess to extend while a bonus window remains', () => {
    expect(nextPhaseAfterGuess(false, 0, KAMMIL.duo.maxExtensions)).toBe('extend');
  });

  it('ends the round once every extension is spent', () => {
    expect(nextPhaseAfterGuess(false, KAMMIL.duo.maxExtensions, KAMMIL.duo.maxExtensions)).toBe(
      'reveal',
    );
  });

  it('a correct guess always ends the round, extensions or not', () => {
    expect(nextPhaseAfterGuess(true, 0, KAMMIL.duo.maxExtensions)).toBe('reveal');
  });
});

describe('scoreKammilDuoRound', () => {
  it('pays a first-try correct guess more than one that needed the extension', () => {
    const firstTry = scoreKammilDuoRound({
      artistId: 'p1',
      guesserId: 'p2',
      correct: true,
      afterExtend: false,
    });
    const afterExtend = scoreKammilDuoRound({
      artistId: 'p1',
      guesserId: 'p2',
      correct: true,
      afterExtend: true,
    });

    expect(firstTry.p2).toBeGreaterThan(afterExtend.p2 as number);
  });

  it('still pays the artist something on a total miss', () => {
    const delta = scoreKammilDuoRound({
      artistId: 'p1',
      guesserId: 'p2',
      correct: false,
      afterExtend: true,
    });
    expect(delta.p2).toBeUndefined();
    expect(delta.p1).toBe(KAMMIL.duo.scores.artistOnFailure);
  });
});
