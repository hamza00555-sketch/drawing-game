import { describe, expect, it } from 'vitest';
import { wireToStroke } from './strokeSync';

describe('wireToStroke', () => {
  const header = {
    playerId: 'p1',
    seq: 3,
    tool: 'pen' as const,
    color: '#E2503A',
    width: 0.02,
    startedAt: 1000,
  };

  it('flattens point chunks in numeric order', () => {
    const stroke = wireToStroke('s1', {
      ...header,
      points: {
        '0': [{ x: 0, y: 0, t: 0 }],
        '1': [{ x: 0.5, y: 0.5, t: 50 }],
        '2': [{ x: 1, y: 1, t: 100 }],
      },
    });

    expect(stroke.points.map((p) => p.t)).toEqual([0, 50, 100]);
  });

  it('orders chunks numerically, not lexicographically', () => {
    // The critical case: string sorting puts "10" before "2", which would draw
    // a stroke's tail through the middle of its own path.
    const stroke = wireToStroke('s1', {
      ...header,
      points: {
        '2': [{ x: 0.2, y: 0, t: 20 }],
        '10': [{ x: 1, y: 0, t: 100 }],
        '1': [{ x: 0.1, y: 0, t: 10 }],
      },
    });

    expect(stroke.points.map((p) => p.t)).toEqual([10, 20, 100]);
  });

  it('handles a stroke whose header arrived before any points', () => {
    const stroke = wireToStroke('s1', header);
    expect(stroke.points).toEqual([]);
    expect(stroke.color).toBe('#E2503A');
  });

  it('preserves author and order so contributions stay attributable', () => {
    const stroke = wireToStroke('s1', header);
    expect(stroke.playerId).toBe('p1');
    expect(stroke.seq).toBe(3);
    expect(stroke.id).toBe('s1');
  });
});
