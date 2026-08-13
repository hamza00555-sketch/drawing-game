/**
 * Replay.
 *
 * Rebuilds a drawing stroke by stroke so players can watch it grow. This is the
 * whole payoff of storing vectors instead of a PNG: the same data that drew the
 * picture can perform it.
 *
 * Deliberately NOT a faithful re-timing of the original. The real drawing took
 * a minute; the replay has a few seconds of everyone's attention. Strokes are
 * paced by contribution, not by their recorded timestamps, so the funny part —
 * watching one player's addition ruin the previous one's — lands quickly.
 */

import type { CanvasRenderer } from './renderer';
import { sortStrokes, type Stroke } from './strokes';

export interface ReplayOptions {
  /** How long each player's contribution takes to draw. */
  msPerContribution: number;
  /** Pause on each name card before that player's strokes begin. */
  holdOnNameMs?: number;
  /** Called when the attributed player changes, to drive the name caption. */
  onPlayerChange?: (playerId: string | undefined) => void;
  onComplete?: () => void;
}

interface Contribution {
  playerId: string;
  strokes: Stroke[];
}

/**
 * Group consecutive strokes by author.
 *
 * Grouping by author rather than per stroke is what makes the replay readable:
 * "then نورة added this" is a beat, whereas eleven separate strokes are not.
 * Consecutive runs matter — if a player draws twice in a round, those are two
 * separate beats, not one merged blob.
 */
export function groupContributions(strokes: readonly Stroke[]): Contribution[] {
  const ordered = sortStrokes(strokes);
  const groups: Contribution[] = [];

  for (const stroke of ordered) {
    const last = groups[groups.length - 1];
    if (last && last.playerId === stroke.playerId) {
      last.strokes.push(stroke);
    } else {
      groups.push({ playerId: stroke.playerId, strokes: [stroke] });
    }
  }

  return groups;
}

export class ReplayPlayer {
  private raf = 0;
  private startedAt = 0;
  private stopped = false;
  private contributions: Contribution[];
  private announced: string | undefined;

  constructor(
    private renderer: CanvasRenderer,
    strokes: readonly Stroke[],
    private options: ReplayOptions,
  ) {
    this.contributions = groupContributions(strokes);
  }

  /** Total wall-clock length, useful for sizing a progress bar. */
  get durationMs(): number {
    const hold = this.options.holdOnNameMs ?? 0;
    return this.contributions.length * (this.options.msPerContribution + hold);
  }

  start(): void {
    this.stopped = false;
    this.startedAt = performance.now();
    this.renderer.clear();
    this.tick();
  }

  stop(): void {
    this.stopped = true;
    if (this.raf !== 0) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  /** Skip to the finished drawing. Every replay needs an escape hatch. */
  finish(): void {
    this.stop();
    this.renderer.redrawAll(this.contributions.flatMap((c) => c.strokes));
    this.options.onPlayerChange?.(undefined);
    this.options.onComplete?.();
  }

  private tick = (): void => {
    if (this.stopped) return;

    const elapsed = performance.now() - this.startedAt;
    const hold = this.options.holdOnNameMs ?? 0;
    const perContribution = this.options.msPerContribution + hold;

    const index = Math.floor(elapsed / perContribution);
    if (index >= this.contributions.length) {
      this.finish();
      return;
    }

    const current = this.contributions[index] as Contribution;
    if (current.playerId !== this.announced) {
      this.announced = current.playerId;
      this.options.onPlayerChange?.(current.playerId);
    }

    // Everything before the current contribution is already fully drawn.
    const settled = this.contributions.slice(0, index).flatMap((c) => c.strokes);

    // Within the current contribution, reveal points proportionally to how far
    // through its slice we are — after the name hold has elapsed.
    const withinMs = Math.max(0, (elapsed % perContribution) - hold);
    const progress = Math.min(1, withinMs / this.options.msPerContribution);

    this.renderer.redrawAll([...settled, ...partialStrokes(current.strokes, progress)]);
    this.renderer.paintNow();

    this.raf = requestAnimationFrame(this.tick);
  };
}

/**
 * Take the first `progress` fraction of a contribution's strokes, measured in
 * total points so a long stroke takes proportionally longer to appear than a
 * short one. Slicing by stroke count instead would make a single long stroke
 * pop into existence at once.
 */
export function partialStrokes(strokes: readonly Stroke[], progress: number): Stroke[] {
  const total = strokes.reduce((sum, stroke) => sum + stroke.points.length, 0);
  if (total === 0) return [];

  let budget = Math.ceil(total * Math.min(1, Math.max(0, progress)));
  const out: Stroke[] = [];

  for (const stroke of strokes) {
    if (budget <= 0) break;

    if (stroke.points.length <= budget) {
      out.push(stroke);
      budget -= stroke.points.length;
    } else {
      out.push({ ...stroke, points: stroke.points.slice(0, budget) });
      budget = 0;
    }
  }

  return out;
}
