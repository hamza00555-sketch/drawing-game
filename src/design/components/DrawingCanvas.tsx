import { useCallback, useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import { CanvasRenderer } from '../../engine/canvas/renderer';
import {
  StrokeBuffer,
  toNormalized,
  type Point,
  type Stroke,
  type Tool,
} from '../../engine/canvas/strokes';

/**
 * The drawing surface.
 *
 * Local-first, without exception: a pointer event is rendered on this device
 * before anything is queued for the network. `onStrokePoint` and `onStrokeEnd`
 * are notifications, not gates — nothing this component draws waits on them.
 *
 * Pointer Events are used rather than touch/mouse pairs so finger, stylus and
 * mouse all take one path. `touch-action: none` is essential: without it the
 * browser claims a drag as a scroll and the first stroke of every turn is lost.
 *
 * LAYOUT CONTRACT: the parent element must be positioned (`relative`) and must
 * have a real height. The canvas fills it with `position: absolute; inset: 0`.
 *
 * This is not stylistic. A <canvas> has an intrinsic size from its width/height
 * ATTRIBUTES, which the renderer sets from the element's measured size. With
 * `height: 100%` against a parent whose own height comes from flex, the
 * percentage cannot resolve, so the element falls back to that intrinsic size —
 * and each resize then measures a smaller box and shrinks the canvas again.
 * Absolute positioning takes the size from the parent's box and breaks the loop.
 */

export interface DrawingCanvasHandle {
  /** Draw a stroke received from another player, still in progress. */
  applyRemoteProgress: (stroke: Stroke) => void;
  /** Bake a completed stroke, local or remote. */
  applyRemoteDone: (stroke: Stroke) => void;
  /** Rebuild from scratch — after reconnect, or when joining mid-round. */
  rebuild: (strokes: readonly Stroke[]) => void;
  clear: () => void;
  /** Flattened image for the poster and results. */
  toDataURL: (background?: string) => string;
  renderer: () => CanvasRenderer | undefined;
}

export interface DrawingCanvasProps {
  /** When false the surface is inert — used for countdowns and other turns. */
  enabled: boolean;
  tool: Tool;
  color: string;
  /** Relative to the smaller canvas edge. */
  width: number;
  playerId: string;
  /**
   * The authoritative stroke list.
   *
   * Not used for normal rendering — strokes are drawn incrementally as they
   * happen. This exists because resizing a canvas destroys its backing store,
   * so the drawing has to be rebuilt from data afterwards. Without it, any
   * layout shift or device rotation silently erases the round.
   */
  strokes: readonly Stroke[];
  /** Monotonic order for the next stroke. */
  nextSeq: () => number;
  /** Server-synced start time for the stroke. */
  now: () => number;
  onStrokeStart?: (stroke: Omit<Stroke, 'points'>) => void;
  onStrokePoint?: (strokeId: string, point: Point) => void;
  onStrokeEnd?: (stroke: Stroke) => void;
  className?: string;
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  function DrawingCanvas(
    {
      enabled,
      tool,
      color,
      width,
      playerId,
      strokes,
      nextSeq,
      now,
      onStrokeStart,
      onStrokePoint,
      onStrokeEnd,
      className = '',
    },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rendererRef = useRef<CanvasRenderer | undefined>(undefined);
    const bufferRef = useRef<StrokeBuffer | undefined>(undefined);
    const strokeIdRef = useRef<string | undefined>(undefined);
    const strokeStartRef = useRef(0);
    const pointerIdRef = useRef<number | undefined>(undefined);

    // Kept in a ref so the ResizeObserver always rebuilds from the CURRENT
    // strokes without having to be torn down and re-created on every change.
    const strokesRef = useRef<readonly Stroke[]>(strokes);
    strokesRef.current = strokes;

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const renderer = new CanvasRenderer(canvas);
      rendererRef.current = renderer;

      /*
       * Resizing a canvas resets its backing store, wiping every pixel. So the
       * drawing is REBUILT from stroke data rather than scaled — which is the
       * whole reason strokes are stored as normalized vectors.
       *
       * The first callback fires on observe() with the initial size, which is
       * also what gives the renderer its real dimensions on mount.
       */
      const observer = new ResizeObserver(() => {
        renderer.resize();
        renderer.redrawAll(strokesRef.current);
      });
      observer.observe(canvas);

      return () => {
        observer.disconnect();
        renderer.destroy();
        rendererRef.current = undefined;
      };
    }, []);

    useImperativeHandle(
      ref,
      (): DrawingCanvasHandle => ({
        applyRemoteProgress: (stroke) => rendererRef.current?.setLiveStroke(stroke),
        applyRemoteDone: (stroke) => rendererRef.current?.commitStroke(stroke),
        rebuild: (strokes) => rendererRef.current?.redrawAll(strokes),
        clear: () => rendererRef.current?.clear(),
        toDataURL: (background) => rendererRef.current?.toDataURL(background) ?? '',
        renderer: () => rendererRef.current,
      }),
      [],
    );

    const currentStroke = useCallback((): Stroke | undefined => {
      const buffer = bufferRef.current;
      const id = strokeIdRef.current;
      if (!buffer || !id) return undefined;
      return buffer.complete(id);
    }, []);

    const handlePointerDown = useCallback(
      (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (!enabled) return;
        // Ignore extra fingers: a second contact mid-stroke is a pinch attempt,
        // not a second line.
        if (pointerIdRef.current !== undefined) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.setPointerCapture(event.pointerId);
        pointerIdRef.current = event.pointerId;

        const id = crypto.randomUUID();
        const startedAt = now();
        strokeIdRef.current = id;
        strokeStartRef.current = startedAt;

        const meta = {
          playerId,
          seq: nextSeq(),
          tool,
          color,
          width,
          startedAt,
        };
        bufferRef.current = new StrokeBuffer(meta);

        const rect = canvas.getBoundingClientRect();
        const { x, y } = toNormalized(event.clientX, event.clientY, rect);
        bufferRef.current.add(x, y, 0);

        onStrokeStart?.({ ...meta, id });
        onStrokePoint?.(id, { x, y, t: 0 });

        const stroke = currentStroke();
        if (stroke) rendererRef.current?.setLiveStroke(stroke);
      },
      [
        enabled,
        playerId,
        tool,
        color,
        width,
        nextSeq,
        now,
        onStrokeStart,
        onStrokePoint,
        currentStroke,
      ],
    );

    const handlePointerMove = useCallback(
      (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (pointerIdRef.current !== event.pointerId) return;

        const canvas = canvasRef.current;
        const buffer = bufferRef.current;
        const id = strokeIdRef.current;
        if (!canvas || !buffer || !id) return;

        const rect = canvas.getBoundingClientRect();

        /*
         * Coalesced events give every sample the OS captured between frames,
         * not just the latest. On a 120Hz screen that is the difference between
         * a smooth curve and a polygon.
         */
        const events =
          typeof event.nativeEvent.getCoalescedEvents === 'function'
            ? event.nativeEvent.getCoalescedEvents()
            : [event.nativeEvent];

        for (const sample of events.length > 0 ? events : [event.nativeEvent]) {
          const { x, y } = toNormalized(sample.clientX, sample.clientY, rect);
          const t = now() - strokeStartRef.current;

          // add() returns false for points too close to matter; skipping those
          // keeps both the wire and the replay free of redundant samples.
          if (buffer.add(x, y, t)) {
            onStrokePoint?.(id, { x, y, t });
          }
        }

        const stroke = currentStroke();
        if (stroke) rendererRef.current?.setLiveStroke(stroke);
      },
      [now, onStrokePoint, currentStroke],
    );

    const endStroke = useCallback(
      (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (pointerIdRef.current !== event.pointerId) return;
        pointerIdRef.current = undefined;

        const buffer = bufferRef.current;
        const id = strokeIdRef.current;
        bufferRef.current = undefined;
        strokeIdRef.current = undefined;

        if (!buffer || !id) return;

        if (buffer.isDegenerate()) {
          rendererRef.current?.dropLiveStroke(id);
          return;
        }

        const stroke = buffer.complete(id);
        rendererRef.current?.commitStroke(stroke);
        onStrokeEnd?.(stroke);
      },
      [onStrokeEnd],
    );

    return (
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        className={[
          'absolute inset-0 block h-full w-full rounded-md bg-paper-canvas',
          // Without touch-action:none the browser treats the first drag as a
          // scroll and eats the opening stroke of every turn.
          'touch-none select-none',
          enabled ? 'cursor-crosshair' : 'cursor-not-allowed',
          className,
        ].join(' ')}
        aria-label="لوحة الرسم"
        role="img"
      />
    );
  },
);
