/**
 * Drawing session hook.
 *
 * Owns everything a mode needs to run a shared canvas: the authoritative stroke
 * list, publishing local strokes, receiving remote ones, undo, and rebuilding
 * after a reconnect or a resize.
 *
 * Modes use this; none of them re-implement it. That is the engine/mode split
 * from ARCHITECTURE.md §8 — a mode decides *who may draw and when*, never *how
 * drawing is transported*.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { getDb } from '../firebase';
import { paths } from '../paths';
import { serverNow } from '../clock';
import { StrokePublisher, watchStrokes, wireToStroke } from './strokeSync';
import { sortStrokes, type Point, type Stroke } from './strokes';
import type { DrawingCanvasHandle } from '../../design/components/DrawingCanvas';

export interface DrawingSessionOptions {
  roomId: string;
  gameId: string;
  playerId: string;
  canvas: React.RefObject<DrawingCanvasHandle | null>;
  /**
   * Which stroke bucket this canvas reads and writes. Defaults to the room's
   * shared canvas; كانت إيش؟ passes a per-link bucket so the chain stays blind.
   */
  bucketPath?: string;
  /** Skip network entirely — used by the dev preview and by local replays. */
  offline?: boolean;
}

export interface DrawingSession {
  strokes: Stroke[];
  /** Monotonic sequence for the next stroke this device starts. */
  nextSeq: () => number;
  now: () => number;
  onStrokeStart: (stroke: Omit<Stroke, 'points'>) => void;
  onStrokePoint: (strokeId: string, point: Point) => void;
  onStrokeEnd: (stroke: Stroke) => void;
  /** Remove this player's most recent stroke. Cannot undo someone else's. */
  undo: () => void;
  canUndo: boolean;
}

export function useDrawingSession({
  roomId,
  gameId,
  playerId,
  canvas,
  bucketPath,
  offline = false,
}: DrawingSessionOptions): DrawingSession {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const publisherRef = useRef<StrokePublisher | undefined>(undefined);
  const seqRef = useRef(0);

  const bucket = bucketPath ?? paths.strokes(roomId, gameId);

  /*
   * Seed from whatever already exists, then follow live changes.
   *
   * This one-shot read is what makes a reconnect — or joining a round already
   * in progress — rebuild the full drawing instead of showing a blank canvas
   * with only the strokes that happen to arrive next.
   */
  useEffect(() => {
    if (offline) return;

    let cancelled = false;
    const strokesRef = ref(getDb(), bucket);

    const stopInitial = onValue(
      strokesRef,
      (snapshot) => {
        if (cancelled) return;

        const raw = (snapshot.val() as Record<string, never> | null) ?? {};
        const existing = sortStrokes(
          Object.entries(raw).map(([id, wire]) => wireToStroke(id, wire)),
        );

        setStrokes(existing);
        canvas.current?.rebuild(existing);

        // Continue this device's numbering above everything already drawn, so a
        // rejoining player cannot reorder the drawing by restarting at zero.
        seqRef.current = existing.reduce((max, s) => Math.max(max, s.seq), -1) + 1;

        // One-shot: live updates are handled by watchStrokes below.
        stopInitial();
      },
      { onlyOnce: true },
    );

    return () => {
      cancelled = true;
    };
  }, [bucket, offline, canvas]);

  useEffect(() => {
    if (offline) return;

    const subscription = watchStrokes(bucket, {
      // Our own strokes are already on screen; echoing them back would draw the
      // same line twice and fight the local buffer.
      ignorePlayerId: playerId,
      onProgress: (stroke) => canvas.current?.applyRemoteProgress(stroke),
      onDone: (stroke) => {
        canvas.current?.applyRemoteDone(stroke);
        setStrokes((current) =>
          current.some((s) => s.id === stroke.id)
            ? current
            : sortStrokes([...current, stroke]),
        );
      },
    });

    return subscription.stop;
  }, [bucket, playerId, offline, canvas]);

  const nextSeq = useCallback(() => {
    const seq = seqRef.current;
    seqRef.current += 1;
    return seq;
  }, []);

  const onStrokeStart = useCallback(
    (stroke: Omit<Stroke, 'points'>) => {
      if (offline) return;

      publisherRef.current = new StrokePublisher(bucket, stroke.id, {
        playerId: stroke.playerId,
        seq: stroke.seq,
        tool: stroke.tool,
        color: stroke.color,
        width: stroke.width,
        startedAt: stroke.startedAt,
      });
    },
    [bucket, offline],
  );

  const onStrokePoint = useCallback((_strokeId: string, point: Point) => {
    // Buffered, not sent. The publisher flushes on its own interval.
    publisherRef.current?.add(point);
  }, []);

  const onStrokeEnd = useCallback((stroke: Stroke) => {
    publisherRef.current?.finish();
    publisherRef.current = undefined;
    setStrokes((current) => sortStrokes([...current, stroke]));
  }, []);

  const mine = strokes.filter((stroke) => stroke.playerId === playerId);

  const undo = useCallback(() => {
    setStrokes((current) => {
      // Only ever remove your own last stroke. Undoing another player's
      // contribution would be a weapon, not a convenience.
      const own = current.filter((stroke) => stroke.playerId === playerId);
      const last = own[own.length - 1];
      if (!last) return current;

      const next = current.filter((stroke) => stroke.id !== last.id);
      canvas.current?.rebuild(next);
      return next;
    });
  }, [playerId, canvas]);

  return {
    strokes,
    nextSeq,
    now: serverNow,
    onStrokeStart,
    onStrokePoint,
    onStrokeEnd,
    undo,
    canUndo: mine.length > 0,
  };
}
