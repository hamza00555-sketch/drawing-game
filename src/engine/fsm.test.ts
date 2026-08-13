import { describe, expect, it } from 'vitest';
import { defineMachine } from './fsm';

const machine = defineMachine({
  initial: 'lobby',
  phases: {
    lobby: { next: ['reveal'], timed: false, describe: 'waiting for players' },
    reveal: { next: ['draw'], timed: true, describe: 'secret roles shown' },
    draw: { next: ['vote'], timed: true, describe: 'shared canvas' },
    vote: { next: ['result'], timed: true, describe: 'who is the impostor' },
    result: { next: [], timed: false, describe: 'scores' },
  },
});

describe('StateMachine', () => {
  it('permits declared transitions and refuses everything else', () => {
    expect(machine.canTransition('draw', 'vote')).toBe(true);
    expect(machine.canTransition('draw', 'result')).toBe(false);
    expect(machine.canTransition('result', 'draw')).toBe(false);
  });

  it('throws on an illegal transition, naming what was allowed', () => {
    expect(() => machine.assertTransition('lobby', 'vote')).toThrowError(/reveal/);
  });

  it('identifies timed and terminal phases', () => {
    expect(machine.isTimed('draw')).toBe(true);
    expect(machine.isTimed('lobby')).toBe(false);
    expect(machine.isTerminal('result')).toBe(true);
    expect(machine.isTerminal('draw')).toBe(false);
  });

  it('validates a well-formed machine', () => {
    expect(() => machine.validate()).not.toThrow();
  });

  it('rejects a transition to a phase that does not exist', () => {
    const broken = defineMachine({
      initial: 'a',
      phases: {
        a: { next: ['typo' as 'b'], timed: false, describe: '' },
        b: { next: [], timed: false, describe: '' },
      },
    });
    expect(() => broken.validate()).toThrowError(/unknown phase/i);
  });

  it('rejects a phase nothing can reach', () => {
    const stranded = defineMachine<'a' | 'orphan'>({
      initial: 'a',
      phases: {
        a: { next: [], timed: false, describe: '' },
        orphan: { next: [], timed: false, describe: '' },
      },
    });
    expect(() => stranded.validate()).toThrowError(/unreachable/i);
  });
});
