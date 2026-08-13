/**
 * Stroke model and buffering.
 *
 * The game never stores a PNG during play. A drawing is a list of strokes, and
 * a stroke is a list of points in NORMALIZED 0..1 space. That single decision
 * buys replay, undo, per-author contribution colouring, reconnect rebuild and
 * poster export from one representation — and makes a drawing render
 * identically on a 320px phone and a tablet.
 *
 * Pixel coordinates would tie a drawing to the screen that produced it, which
 * breaks the moment two players have different phones. Which is always.
 */

export type Tool = 'pen' | 'eraser';

export interface Point {
  /** 0..1, relative to canvas width. */
  x: number;
  /** 0..1, relative to canvas height. */
  y: number;
  /** Milliseconds since the stroke started. Drives replay pacing. */
  t: number;
}

export interface Stroke {
  id: string;
  playerId: string;
  /** Monotonic per game. Establishes draw order for rebuild and replay. */
  seq: number;
  tool: Tool;
  /** Author's pen colour. Kept per-stroke so contributions stay attributable. */
  color: string;
  /** 0..1, relative to the canvas's smaller dimension. */
  width: number;
  points: Point[];
  /** Server-stamped start time. */
  startedAt: number;
}

/** A stroke still being drawn — not yet committed. */
export interface PendingStroke extends Omit<Stroke, 'id'> {
  id?: string;
}

/**
 * Convert a pointer position into normalized space.
 * Clamped so a finger dragged past the canvas edge does not produce points
 * outside 0..1, which would render off-canvas on a differently shaped screen.
 */
export function toNormalized(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): { x: number; y: number } {
  return {
    x: clamp01((clientX - rect.left) / rect.width),
    y: clamp01((clientY - rect.top) / rect.height),
  };
}

export function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * Drop points that add no visible information.
 *
 * A modern phone fires pointer events far faster than the drawing needs, and
 * every retained point costs bandwidth on every broadcast and bytes in every
 * replay. Filtering by minimum distance keeps the line's shape while cutting
 * point count substantially on slow, deliberate strokes.
 */
export function shouldKeepPoint(
  previous: Point | undefined,
  candidate: { x: number; y: number },
  minDistance = 0.004,
): boolean {
  if (!previous) return true;
  const dx = candidate.x - previous.x;
  const dy = candidate.y - previous.y;
  return dx * dx + dy * dy >= minDistance * minDistance;
}

/**
 * Accumulates points for the stroke in progress and hands them out in chunks.
 *
 * This is the piece that keeps the pen feeling local. The renderer draws every
 * point the instant it arrives; this buffer exists only to decide what to put
 * on the wire and when. Network conditions change `flush()` timing, never what
 * the artist sees.
 */
export class StrokeBuffer {
  private points: Point[] = [];
  private unsent = 0;

  constructor(
    readonly meta: Omit<Stroke, 'points' | 'id'>,
    private readonly minDistance = 0.004,
  ) {}

  /** Returns true when the point was kept (and therefore should be drawn). */
  add(x: number, y: number, t: number): boolean {
    const last = this.points[this.points.length - 1];
    if (!shouldKeepPoint(last, { x, y }, this.minDistance)) return false;

    this.points.push({ x, y, t });
    this.unsent += 1;
    return true;
  }

  /** Points added since the last flush. Empty when there is nothing to send. */
  flush(): Point[] {
    if (this.unsent === 0) return [];
    const chunk = this.points.slice(this.points.length - this.unsent);
    this.unsent = 0;
    return chunk;
  }

  get pointCount(): number {
    return this.points.length;
  }

  /** The finished stroke, ready to be committed once. */
  complete(id: string): Stroke {
    return { ...this.meta, id, points: this.points };
  }

  /**
   * A stroke of one point is a tap, which should still leave a dot. Two
   * identical points give the renderer a segment to draw.
   */
  isDegenerate(): boolean {
    return this.points.length === 0;
  }
}

/** Deterministic ordering for rebuild and replay: by seq, then by start time. */
export function sortStrokes(strokes: readonly Stroke[]): Stroke[] {
  return [...strokes].sort((a, b) => a.seq - b.seq || a.startedAt - b.startedAt);
}

/** Total duration of a drawing, used to pace replay. */
export function strokeDuration(stroke: Stroke): number {
  const last = stroke.points[stroke.points.length - 1];
  return last ? last.t : 0;
}
