import { describe, expect, it } from 'vitest';
import { nextInTurnCycle, startTurnCycle, type TurnCycleState } from '../../shared/turnCycle';

/** Drives `nextInTurnCycle` for `rounds` picks, feeding each round's state
 * back in — this is exactly what a server handler does across many rounds. */
function drive(
  playerIds: readonly string[],
  rounds: number,
  random: () => number = Math.random,
): string[] {
  let state: TurnCycleState | undefined;
  const picks: string[] = [];
  for (let i = 0; i < rounds; i += 1) {
    const result = nextInTurnCycle(state, playerIds, random);
    picks.push(result.playerId);
    state = result.state;
  }
  return picks;
}

describe('startTurnCycle', () => {
  it('shuffles every player into the order exactly once', () => {
    const { order } = startTurnCycle(['p1', 'p2', 'p3', 'p4'], () => 0);
    expect(order.slice().sort()).toEqual(['p1', 'p2', 'p3', 'p4']);
    expect(order).toHaveLength(4);
  });

  it('starts at position 0', () => {
    expect(startTurnCycle(['p1', 'p2']).position).toBe(0);
  });
});

describe('nextInTurnCycle', () => {
  it('gives every player exactly one turn before anyone repeats', () => {
    const players = ['p1', 'p2', 'p3', 'p4', 'p5'];
    const picks = drive(players, players.length);
    expect(picks.slice().sort()).toEqual(players.slice().sort());
    expect(new Set(picks).size).toBe(players.length);
  });

  it('never lets the same player go twice in a row, even across a reshuffle', () => {
    // Crafted so that, without the seam fix, the player who finishes cycle 1
    // (p3) would be reshuffled straight back to the front of cycle 2 — a
    // back-to-back repeat exactly where "reshuffle every N rounds" naively
    // breaks. Values are queued in the exact order Fisher-Yates consumes
    // them: cycle 1's shuffle raw-produces ['p1','p2','p3'] (p3 last), then
    // cycle 2's raw shuffle would produce ['p3','p2','p1'] (p3 first again)
    // before the avoid-the-seam swap runs.
    function sequence(...values: number[]): () => number {
      let i = 0;
      return () => values[Math.min(i++, values.length - 1)] as number;
    }
    const random = sequence(0.99, 0.99, 0, 0.99);

    const players = ['p1', 'p2', 'p3'];
    const picks = drive(players, 4, random);

    expect(picks).toEqual(['p1', 'p2', 'p3', 'p2']);
    for (let i = 1; i < picks.length; i += 1) {
      expect(picks[i]).not.toBe(picks[i - 1]);
    }
  });

  it('at two players, this is exactly strict alternation', () => {
    const picks = drive(['p1', 'p2'], 10);
    for (let i = 1; i < picks.length; i += 1) {
      expect(picks[i]).not.toBe(picks[i - 1]);
    }
    // Both players actually appear — not one player forever.
    expect(new Set(picks)).toEqual(new Set(['p1', 'p2']));
  });

  it('does not always start the same player first', () => {
    const a = nextInTurnCycle(undefined, ['p1', 'p2', 'p3'], () => 0).playerId;
    const b = nextInTurnCycle(undefined, ['p1', 'p2', 'p3'], () => 0.99).playerId;
    expect(a).not.toBe(b);
  });

  it('starts a fresh cycle when the roster changes mid-cycle', () => {
    const first = nextInTurnCycle(undefined, ['p1', 'p2', 'p3'], () => 0);
    expect(first.state.position).toBe(1);

    // p4 joins before the cycle finished — there is no fair way to "resume"
    // with a new player who was never in the shuffled order.
    const second = nextInTurnCycle(first.state, ['p1', 'p2', 'p3', 'p4'], () => 0);
    expect(second.state.order.slice().sort()).toEqual(['p1', 'p2', 'p3', 'p4']);
    expect(second.state.position).toBe(1);
  });

  it('over many full cycles, everyone gets turns within one of each other', () => {
    // The classic failure mode this replaces: pure chance can hand one
    // player five turns while another gets zero. Across 3 full cycles nobody
    // should be more than one turn ahead of anybody else.
    const players = ['p1', 'p2', 'p3', 'p4'];
    const picks = drive(players, players.length * 3);
    const counts = players.map((id) => picks.filter((p) => p === id).length);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });
});
