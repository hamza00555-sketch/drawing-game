/**
 * Canvas renderer.
 *
 * Two surfaces, one visible:
 *
 *   - a COMMITTED offscreen canvas holding every finished stroke, and
 *   - the visible canvas, which each frame is cleared, blitted from the
 *     committed bitmap, then has the in-progress strokes drawn on top.
 *
 * Redrawing hundreds of finished strokes on every pointer move would cost the
 * frame budget the moment a drawing gets busy; blitting one bitmap does not.
 *
 * This layout is also what makes the eraser correct. An eraser is
 * `destination-out`, so it has to act on a surface that already contains the
 * pixels it is removing. Because the visible canvas is blitted from the
 * committed bitmap before live strokes are drawn, an in-progress eraser erases
 * finished strokes exactly as the artist expects — and when it completes, the
 * same operation is replayed into the committed bitmap so it persists.
 *
 * Coordinates arrive normalized (0..1) and are scaled here, which is what lets
 * the same stroke data render identically on a 320px phone and a tablet.
 */

import type { Point, Stroke } from './strokes';

/** Stroke width is relative to the smaller edge, so a line keeps its weight. */
function scaleWidth(width: number, canvasWidth: number, canvasHeight: number): number {
  return Math.max(1, width * Math.min(canvasWidth, canvasHeight));
}

function applyStrokeStyle(
  ctx: CanvasRenderingContext2D,
  stroke: Pick<Stroke, 'tool' | 'color' | 'width'>,
  width: number,
  height: number,
): void {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = scaleWidth(stroke.width, width, height);

  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    // Any opaque colour works; only the alpha matters for destination-out.
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = stroke.color;
  }
}

/**
 * Draw a stroke's path. `from` allows appending only the new tail of a stroke
 * that is still being drawn, instead of re-stroking the whole path each frame.
 */
export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Pick<Stroke, 'tool' | 'color' | 'width'> & { points: readonly Point[] },
  width: number,
  height: number,
  from = 0,
): void {
  const { points } = stroke;
  if (points.length === 0) return;

  applyStrokeStyle(ctx, stroke, width, height);

  // A single point is a tap, and a tap should still leave a dot. Stroking a
  // zero-length path draws nothing, so it is rendered as a filled circle.
  if (points.length === 1) {
    const only = points[0] as Point;
    const radius = ctx.lineWidth / 2;
    ctx.beginPath();
    ctx.arc(only.x * width, only.y * height, radius, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    return;
  }

  const start = Math.max(0, Math.min(from, points.length - 2));

  ctx.beginPath();
  const first = points[start] as Point;
  ctx.moveTo(first.x * width, first.y * height);

  for (let i = start + 1; i < points.length; i += 1) {
    const point = points[i] as Point;
    ctx.lineTo(point.x * width, point.y * height);
  }

  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
}

export class CanvasRenderer {
  private committed: HTMLCanvasElement;
  private committedCtx: CanvasRenderingContext2D;
  private ctx: CanvasRenderingContext2D;

  /** Strokes still being drawn, keyed by stroke id. */
  private live = new Map<string, Stroke>();
  private frame = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private dpr = Math.min(window.devicePixelRatio || 1, 2),
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');
    this.ctx = ctx;

    this.committed = document.createElement('canvas');
    const committedCtx = this.committed.getContext('2d');
    if (!committedCtx) throw new Error('2D canvas context unavailable');
    this.committedCtx = committedCtx;

    this.resize();
  }

  /** CSS pixel size of the drawing surface. */
  get width(): number {
    return this.canvas.clientWidth;
  }

  get height(): number {
    return this.canvas.clientHeight;
  }

  /**
   * Match the backing store to the element's CSS size and device pixel ratio.
   * The committed bitmap is destroyed by this, so callers must redraw from
   * stroke data afterwards — which is exactly why strokes are stored as data
   * rather than as pixels.
   */
  resize(): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (width === 0 || height === 0) return;

    for (const surface of [this.canvas, this.committed]) {
      surface.width = Math.round(width * this.dpr);
      surface.height = Math.round(height * this.dpr);
    }

    // Draw in CSS pixels; the transform handles the device ratio.
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.committedCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /** Wipe both surfaces and forget any in-progress strokes. */
  clear(): void {
    this.live.clear();
    this.committedCtx.clearRect(0, 0, this.width, this.height);
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  /** Bake a finished stroke into the committed bitmap. */
  commitStroke(stroke: Stroke): void {
    this.live.delete(stroke.id);
    drawStroke(this.committedCtx, stroke, this.width, this.height);
    this.scheduleRepaint();
  }

  /**
   * Rebuild everything from stroke data. Used after a resize, after a reconnect,
   * and to seed a canvas a player is joining mid-round.
   */
  redrawAll(strokes: readonly Stroke[]): void {
    this.committedCtx.clearRect(0, 0, this.width, this.height);
    for (const stroke of strokes) {
      drawStroke(this.committedCtx, stroke, this.width, this.height);
    }
    this.scheduleRepaint();
  }

  /** Add or update a stroke that is still being drawn (local or remote). */
  setLiveStroke(stroke: Stroke): void {
    this.live.set(stroke.id, stroke);
    this.scheduleRepaint();
  }

  dropLiveStroke(strokeId: string): void {
    if (this.live.delete(strokeId)) this.scheduleRepaint();
  }

  /**
   * Repaint is coalesced into one animation frame. Pointer events fire far
   * faster than the display refreshes, and painting per event burns frames
   * without ever being seen.
   */
  private scheduleRepaint(): void {
    if (this.frame !== 0) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.paint();
    });
  }

  private paint(): void {
    const { width, height } = this;
    if (width === 0 || height === 0) return;

    this.ctx.clearRect(0, 0, width, height);
    this.ctx.drawImage(this.committed, 0, 0, width, height);

    for (const stroke of this.live.values()) {
      drawStroke(this.ctx, stroke, width, height);
    }
  }

  /** Force an immediate paint. Used by replay, which drives its own timing. */
  paintNow(): void {
    if (this.frame !== 0) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
    this.paint();
  }

  /**
   * Flatten to an image for the share poster and final results.
   * The paper ground is painted underneath, because the canvas itself is
   * transparent and a PNG with an alpha background looks broken in a gallery
   * or a messaging app.
   */
  toDataURL(background = '#FFFDF8', type = 'image/png'): string {
    const out = document.createElement('canvas');
    out.width = this.canvas.width;
    out.height = this.canvas.height;

    const ctx = out.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(this.canvas, 0, 0);

    return out.toDataURL(type);
  }

  destroy(): void {
    if (this.frame !== 0) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.live.clear();
  }
}
