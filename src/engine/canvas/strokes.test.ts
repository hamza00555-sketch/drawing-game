import { describe, expect, it } from 'vitest';
import {
  StrokeBuffer,
  shouldKeepPoint,
  sortStrokes,
  toNormalized,
  type Stroke,
} from './strokes';

const meta = {
  playerId: 'p1',
  seq: 0,
  tool: 'pen' as const,
  color: '#2A211C',
  width: 0.01,
  startedAt: 0,
};

describe('toNormalized', () => {
  const rect = { left: 20, top: 40, width: 200, height: 400 };

  it('maps a pointer position into 0..1 space', () => {
    expect(toNormalized(120, 240, rect)).toEqual({ x: 0.5, y: 0.5 });
  });

  it('clamps a finger dragged past the edge, so points stay on canvas', () => {
    expect(toNormalized(-500, -500, rect)).toEqual({ x: 0, y: 0 });
    expect(toNormalized(9999, 9999, rect)).toEqual({ x: 1, y: 1 });
  });
});

describe('shouldKeepPoint', () => {
  it('always keeps the first point', () => {
    expect(shouldKeepPoint(undefined, { x: 0.5, y: 0.5 })).toBe(true);
  });

  it('drops points too close to add visible information', () => {
    const previous = { x: 0.5, y: 0.5, t: 0 };
    expect(shouldKeepPoint(previous, { x: 0.5001, y: 0.5 })).toBe(false);
    expect(shouldKeepPoint(previous, { x: 0.53, y: 0.5 })).toBe(true);
  });
});

describe('StrokeBuffer', () => {
  it('hands out only points added since the previous flush', () => {
    const buffer = new StrokeBuffer(meta);
    buffer.add(0.1, 0.1, 0);
    buffer.add(0.3, 0.3, 16);

    expect(buffer.flush()).toHaveLength(2);

    buffer.add(0.5, 0.5, 32);
    const second = buffer.flush();
    expect(second).toHaveLength(1);
    expect(second[0]?.x).toBeCloseTo(0.5);
  });

  it('returns nothing when there is nothing new to send', () => {
    const buffer = new StrokeBuffer(meta);
    buffer.add(0.1, 0.1, 0);
    buffer.flush();
    expect(buffer.flush()).toEqual([]);
  });

  it('reports rejected points so the renderer skips them too', () => {
    const buffer = new StrokeBuffer(meta);
    expect(buffer.add(0.5, 0.5, 0)).toBe(true);
    expect(buffer.add(0.5001, 0.5, 8)).toBe(false);
    expect(buffer.pointCount).toBe(1);
  });

  it('keeps every point in the completed stroke, not just the last chunk', () => {
    const buffer = new StrokeBuffer(meta);
    buffer.add(0.1, 0.1, 0);
    buffer.flush();
    buffer.add(0.9, 0.9, 50);

    const stroke = buffer.complete('s1');
    expect(stroke.points).toHaveLength(2);
    expect(stroke.id).toBe('s1');
  });

  it('treats an untouched buffer as degenerate', () => {
    expect(new StrokeBuffer(meta).isDegenerate()).toBe(true);
  });
});

describe('sortStrokes', () => {
  it('orders by seq so a rebuild replays the drawing as it was made', () => {
    const strokes = [
      { ...meta, id: 'c', seq: 2, points: [] },
      { ...meta, id: 'a', seq: 0, points: [] },
      { ...meta, id: 'b', seq: 1, points: [] },
    ] satisfies Stroke[];

    expect(sortStrokes(strokes).map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the input', () => {
    const strokes = [
      { ...meta, id: 'b', seq: 1, points: [] },
      { ...meta, id: 'a', seq: 0, points: [] },
    ] satisfies Stroke[];

    sortStrokes(strokes);
    expect(strokes[0]?.id).toBe('b');
  });
});
