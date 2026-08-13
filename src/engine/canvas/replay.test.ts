import { describe, expect, it } from 'vitest';
import { groupContributions, partialStrokes } from './replay';
import type { Point, Stroke } from './strokes';

function stroke(id: string, playerId: string, seq: number, pointCount = 3): Stroke {
  const points: Point[] = Array.from({ length: pointCount }, (_, i) => ({
    x: i / 10,
    y: i / 10,
    t: i * 10,
  }));
  return {
    id,
    playerId,
    seq,
    tool: 'pen',
    color: '#000',
    width: 0.01,
    startedAt: seq,
    points,
  };
}

describe('groupContributions', () => {
  it('groups consecutive strokes by the same author into one beat', () => {
    const groups = groupContributions([
      stroke('a', 'p1', 0),
      stroke('b', 'p1', 1),
      stroke('c', 'p2', 2),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.playerId).toBe('p1');
    expect(groups[0]?.strokes).toHaveLength(2);
    expect(groups[1]?.playerId).toBe('p2');
  });

  it('keeps a returning player as a separate beat, not a merged blob', () => {
    // p1 draws, p2 draws, p1 draws again — that is three beats in the replay,
    // because merging the two p1 turns would misattribute when things happened.
    const groups = groupContributions([
      stroke('a', 'p1', 0),
      stroke('b', 'p2', 1),
      stroke('c', 'p1', 2),
    ]);

    expect(groups.map((g) => g.playerId)).toEqual(['p1', 'p2', 'p1']);
  });

  it('orders by seq regardless of arrival order', () => {
    const groups = groupContributions([
      stroke('c', 'p3', 2),
      stroke('a', 'p1', 0),
      stroke('b', 'p2', 1),
    ]);

    expect(groups.map((g) => g.playerId)).toEqual(['p1', 'p2', 'p3']);
  });

  it('handles an empty drawing', () => {
    expect(groupContributions([])).toEqual([]);
  });
});

describe('partialStrokes', () => {
  const contribution = [stroke('a', 'p1', 0, 4), stroke('b', 'p1', 1, 6)];

  it('reveals nothing at the start and everything at the end', () => {
    expect(partialStrokes(contribution, 0)).toHaveLength(0);

    const full = partialStrokes(contribution, 1);
    expect(full).toHaveLength(2);
    expect(full[1]?.points).toHaveLength(6);
  });

  it('measures progress in points, so a long stroke takes longer to appear', () => {
    // 10 points total; 50% is 5 points: all of stroke a (4) plus 1 of stroke b.
    const half = partialStrokes(contribution, 0.5);
    expect(half).toHaveLength(2);
    expect(half[0]?.points).toHaveLength(4);
    expect(half[1]?.points).toHaveLength(1);
  });

  it('truncates rather than mutating the source stroke', () => {
    partialStrokes(contribution, 0.5);
    expect(contribution[1]?.points).toHaveLength(6);
  });

  it('clamps progress outside 0..1', () => {
    expect(partialStrokes(contribution, -5)).toHaveLength(0);
    expect(partialStrokes(contribution, 99)).toHaveLength(2);
  });

  it('handles strokes with no points', () => {
    const empty = [{ ...stroke('a', 'p1', 0), points: [] }];
    expect(partialStrokes(empty, 0.5)).toEqual([]);
  });
});
