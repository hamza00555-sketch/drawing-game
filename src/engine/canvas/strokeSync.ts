/**
 * Stroke synchronisation.
 *
 * The contract this module exists to uphold: **the network never touches how
 * the pen feels.** Every pointer event is rendered locally the instant it
 * arrives. This module only decides what goes on the wire, and when.
 *
 * Shape of a stroke on the wire:
 *
 *   {bucket}/{strokeId}
 *     playerId, seq, tool, color, width, startedAt   ← written once, up front
 *     points/{chunkIndex}: [{x,y,t}, ...]            ← appended every ~50ms
 *     done: true                                     ← written at stroke end
 *
 * The bucket is a path, not a (roomId, gameId) pair, because كانت إيش؟ needs one
 * bucket per link in the chain — see `paths.linkStrokes`. Everything below is
 * indifferent to which bucket it is pointed at.
 *
 * Points are appended as CHUNKS rather than written per point. A phone fires
 * pointer events far faster than anyone needs to see them, and one database
 * write per point would be both ruinous and pointless. Chunking also means a
 * viewer sees the line grow smoothly instead of appearing all at once.
 *
 * Chunks are numbered, so a late-arriving chunk cannot reorder a line.
 */

import { get, onChildAdded, onChildChanged, onChildRemoved, ref, remove, set, update } from 'firebase/database';
import { getDb } from '../firebase';
import { sortStrokes, type Point, type Stroke, type Tool } from './strokes';

/** How often buffered points are flushed. Roughly three display frames. */
export const FLUSH_INTERVAL_MS = 50;

export interface StrokeHeader {
  playerId: string;
  seq: number;
  tool: Tool;
  color: string;
  width: number;
  startedAt: number;
}

/** Wire representation. `points` is a map of chunk index to point array. */
interface WireStroke extends StrokeHeader {
  points?: Record<string, Point[]>;
  done?: boolean;
}

function flattenPoints(points: Record<string, Point[]> | undefined): Point[] {
  if (!points) return [];

  return Object.keys(points)
    .map(Number)
    .sort((a, b) => a - b)
    .flatMap((index) => points[String(index)] ?? []);
}

export function wireToStroke(id: string, wire: WireStroke): Stroke {
  return {
    id,
    playerId: wire.playerId,
    seq: wire.seq,
    tool: wire.tool,
    color: wire.color,
    width: wire.width,
    startedAt: wire.startedAt,
    points: flattenPoints(wire.points),
  };
}

/**
 * Publishes one stroke as it is drawn.
 *
 * Created on pointer-down, fed points as they arrive, and finished on
 * pointer-up. Nothing here blocks the caller: every method returns immediately
 * and the writes happen in the background.
 */
export class StrokePublisher {
  private chunkIndex = 0;
  private pending: Point[] = [];
  private timer: ReturnType<typeof setInterval> | undefined;
  private closed = false;

  private readonly strokePath: string;

  constructor(bucketPath: string, readonly strokeId: string, header: StrokeHeader) {
    this.strokePath = `${bucketPath}/${strokeId}`;

    // The header goes out immediately so other players can start rendering the
    // line's colour and weight before any points arrive.
    void set(ref(getDb(), this.strokePath), header);

    this.timer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
  }

  /** Buffer a point. Rendering already happened locally; this is wire only. */
  add(point: Point): void {
    if (this.closed) return;
    this.pending.push(point);
  }

  private flush(): void {
    if (this.pending.length === 0) return;

    const chunk = this.pending;
    this.pending = [];

    const index = this.chunkIndex;
    this.chunkIndex += 1;

    void update(ref(getDb(), `${this.strokePath}/points`), { [index]: chunk });
  }

  /**
   * Finish the stroke: flush whatever is left, then mark it done so viewers
   * know the line is complete and can move it into their committed layer.
   */
  finish(): void {
    if (this.closed) return;
    this.closed = true;

    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    this.flush();
    void update(ref(getDb(), this.strokePath), { done: true });
  }
}

/**
 * Remove a stroke — what "تراجع" actually does on the wire.
 *
 * Undo used to only touch this device's own React state: the artist's canvas
 * cleared the line, but nothing told Firebase, so every OTHER viewer kept
 * showing it forever. Deleting the node here is what `onChildRemoved` below
 * exists to notice, on every other subscribed client.
 */
export function deleteStroke(bucketPath: string, strokeId: string): void {
  void remove(ref(getDb(), `${bucketPath}/${strokeId}`));
}

export interface StrokeSubscription {
  stop: () => void;
}

/**
 * Read a finished drawing once, in order.
 *
 * For drawings nobody is adding to any more: the previous link of a كانت إيش؟
 * chain, or a poster panel. A live session would keep a listener open on a
 * bucket that will never change again.
 *
 * Returns an empty list rather than throwing when the read is refused, because
 * "you may not see this" is an ordinary answer here — it is what the blindness
 * rule is for, and the caller renders an empty canvas either way.
 */
export async function readStrokesOnce(bucketPath: string): Promise<Stroke[]> {
  try {
    const snapshot = await get(ref(getDb(), bucketPath));
    const raw = (snapshot.val() as Record<string, WireStroke> | null) ?? {};

    return sortStrokes(Object.entries(raw).map(([id, wire]) => wireToStroke(id, wire)));
  } catch {
    return [];
  }
}

/**
 * Watch a game's strokes.
 *
 * `onProgress` fires as a stroke grows (including for strokes that already
 * existed when this client attached — which is what makes rejoining mid-round
 * rebuild the drawing), `onDone` fires when it is complete, and `onRemoved`
 * fires when its author undoes it.
 *
 * Strokes authored by `ignorePlayerId` are skipped in `onProgress`/`onDone`:
 * the local artist has already rendered them, and echoing them back would draw
 * the same line twice and fight the local buffer. `onRemoved` is NOT filtered
 * this way — the artist's own undo already updates their local state directly;
 * every OTHER viewer only learns about it through this event.
 */
export function watchStrokes(
  bucketPath: string,
  handlers: {
    onProgress: (stroke: Stroke) => void;
    onDone: (stroke: Stroke) => void;
    onRemoved?: (strokeId: string) => void;
    ignorePlayerId?: string;
  },
): StrokeSubscription {
  const strokesRef = ref(getDb(), bucketPath);

  const handle = (id: string | null, value: unknown) => {
    if (!id || value === null || typeof value !== 'object') return;

    const wire = value as WireStroke;
    if (handlers.ignorePlayerId && wire.playerId === handlers.ignorePlayerId) return;

    const stroke = wireToStroke(id, wire);
    if (wire.done) handlers.onDone(stroke);
    else handlers.onProgress(stroke);
  };

  const stopAdded = onChildAdded(strokesRef, (snapshot) =>
    handle(snapshot.key, snapshot.val()),
  );
  const stopChanged = onChildChanged(strokesRef, (snapshot) =>
    handle(snapshot.key, snapshot.val()),
  );
  const stopRemoved = onChildRemoved(strokesRef, (snapshot) => {
    if (snapshot.key) handlers.onRemoved?.(snapshot.key);
  });

  return {
    stop: () => {
      stopAdded();
      stopChanged();
      stopRemoved();
    },
  };
}
