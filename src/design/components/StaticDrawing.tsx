import { useEffect, useRef } from 'react';
import { CanvasRenderer } from '../../engine/canvas/renderer';
import type { Stroke } from '../../engine/canvas/strokes';

/**
 * A finished drawing, rendered read-only.
 *
 * Used wherever a drawing is shown but not edited: the guess screen, results,
 * and the share poster. It reuses the same renderer as the live canvas, so a
 * drawing looks identical whether it is being made or being judged — a separate
 * display path would eventually drift in line weight or scaling.
 *
 * Redraws on resize for the same reason the live canvas does: resizing a canvas
 * clears it, and the picture is rebuilt from stroke data.
 *
 * LAYOUT CONTRACT — identical to DrawingCanvas: the parent must be positioned
 * (`relative`) and must have a real height. This component fills it absolutely.
 * A percentage height cannot resolve against a parent whose own height comes
 * from flex, so `h-full` here silently collapses the surface to zero and the
 * drawing renders into nothing.
 */

export interface StaticDrawingProps {
  strokes: readonly Stroke[];
  className?: string;
  /** Exposes the renderer so a replay can drive this surface. */
  onReady?: (renderer: CanvasRenderer) => void;
}

export function StaticDrawing({ strokes, className = '', onReady }: StaticDrawingProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | undefined>(undefined);
  const strokesRef = useRef<readonly Stroke[]>(strokes);
  strokesRef.current = strokes;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new CanvasRenderer(canvas);
    rendererRef.current = renderer;
    onReady?.(renderer);

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
    // Mount-only on purpose: onReady is deliberately NOT a dependency, because
    // re-running this effect would destroy and rebuild the renderer on every
    // parent render — and a replay driving this surface would be cut off.
  }, []);

  useEffect(() => {
    rendererRef.current?.redrawAll(strokes);
  }, [strokes]);

  return (
    <div
      className={`absolute inset-0 overflow-hidden rounded-md bg-paper-canvas ${className}`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
    </div>
  );
}
