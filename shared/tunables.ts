/**
 * وش ذا؟ — what a host is allowed to retune, and within what limits.
 *
 * `config/balance.ts` holds the DEFAULTS. This file describes which of them a
 * room may override from the settings screen, and the bounds each one is
 * clamped to. It exists so there is exactly one description of a tunable
 * rather than three that can drift: the settings screen renders its controls
 * from this list, the server clamps incoming values against this same list,
 * and the labels shown to the host live here too.
 *
 * The bounds are not decoration. Settings are written by a client — the host's
 * device — so "30 seconds" arriving as 0, as -1, or as 9e9 is a thing that can
 * actually happen, and each of those would break a round in a different way
 * (an instantly-expiring phase, a negative deadline, a turn nobody can end).
 * `resolveSettings` is the only supported way to read them back.
 *
 * Keep this file dependency-free — it is compiled into both the client bundle
 * and the trusted server build.
 */

export type TunableMode = 'mozawwer' | 'kammil' | 'mamnou3at' | 'mushtarak' | 'kanatEsh';

export type TunableUnit = 'seconds' | 'count' | 'thickness';

export interface Tunable {
  /**
   * Where the value lives inside the mode's settings object. Nested rather
   * than a dotted string because Realtime Database keys may not contain a
   * dot — `duo.drawMs` is not a writable key, `duo/drawMs` is.
   */
  path: readonly string[];
  label: string;
  unit: TunableUnit;
  min: number;
  max: number;
  /** Step in the DISPLAYED unit — seconds for `seconds`, raw otherwise. */
  step: number;
}

/** Milliseconds per displayed unit, so the UI can show seconds and store ms. */
export const UNIT_SCALE: Record<TunableUnit, number> = {
  seconds: 1_000,
  count: 1,
  thickness: 1,
};

const secs = (
  path: readonly string[],
  label: string,
  min: number,
  max: number,
  step = 1,
): Tunable => ({ path, label, unit: 'seconds', min, max, step });

const count = (
  path: readonly string[],
  label: string,
  min: number,
  max: number,
): Tunable => ({ path, label, unit: 'count', min, max, step: 1 });

/**
 * Per-mode tunables, split so the settings screen can head them "جماعي" and
 * "لاعبين" — the Duo ruleset has its own timings and they are the ones a host
 * is most likely to want to touch.
 */
export const MODE_TUNABLES: Record<TunableMode, readonly Tunable[]> = {
  mozawwer: [
    secs(['turnMs'], 'مدة دور الرسم', 5, 90),
    secs(['votingMs'], 'وقت التصويت', 10, 120),
    secs(['impostorGuessMs'], 'فرصة المزوّر الأخيرة', 5, 60),
    count(['minTurnsBeforeReady'], 'أقل عدد أدوار قبل التصويت', 1, 10),
    count(['maxTurns'], 'أقصى عدد أدوار', 2, 30),
  ],
  mamnou3at: [
    secs(['briefMs'], 'وقت قراءة الكلمة', 3, 30),
    secs(['drawMs'], 'مدة الرسم', 15, 180),
    secs(['duo', 'briefMs'], 'لاعبين: وقت قراءة الكلمة', 3, 30),
    secs(['duo', 'drawMs'], 'لاعبين: مدة الرسم', 10, 120),
  ],
  kammil: [
    secs(['countdownMs'], 'العدّاد قبل الدور', 1, 10),
    secs(['guessMs'], 'وقت التخمين', 5, 90),
    secs(['duo', 'countdownMs'], 'لاعبين: العدّاد', 1, 10),
    secs(['duo', 'turnMs'], 'لاعبين: مدة كل مرحلة رسم', 3, 40),
    secs(['duo', 'guessMs'], 'لاعبين: وقت التخمين', 5, 60),
    count(['duo', 'stages'], 'لاعبين: عدد مراحل الرسم', 1, 6),
  ],
  mushtarak: [
    secs(['briefMs'], 'وقت قراءة نصّك', 3, 30),
    secs(['drawMs'], 'مدة الرسم', 15, 180),
    secs(['guessMs'], 'وقت التخمين', 5, 90),
    secs(['duo', 'briefMs'], 'لاعبين: وقت قراءة نصّك', 3, 30),
    secs(['duo', 'turnMs'], 'لاعبين: مدة كل دور', 2, 30),
    secs(['duo', 'guessMs'], 'لاعبين: وقت التخمين', 5, 60),
    count(['duo', 'totalSwaps'], 'لاعبين: عدد التبديلات', 2, 12),
  ],
  kanatEsh: [
    secs(['drawMs'], 'مدة الرسم', 10, 120),
    secs(['writeMs'], 'مدة الكتابة', 10, 120),
    secs(['duo', 'drawMs'], 'لاعبين: مدة الرسم', 10, 120),
    secs(['duo', 'writeMs'], 'لاعبين: مدة الكتابة', 10, 120),
    count(['duo', 'repeats'], 'لاعبين: عدد دورات الرسم والتخمين', 1, 5),
  ],
};

/**
 * Pen and eraser thickness, shared by every mode.
 *
 * Stroke width is stored normalised (a fraction of the canvas's smaller side)
 * so a line looks the same on any screen — see `scaleWidth` in the renderer.
 * These are therefore small decimals, which is also why they get their own
 * unit: a stepper showing "0.012" is meaningless to a host, so the screen
 * renders them as a labelled coarse scale instead.
 */
export const DRAWING_TUNABLES: readonly Tunable[] = [
  { path: ['penWidth'], label: 'سماكة القلم', unit: 'thickness', min: 0.004, max: 0.04, step: 0.002 },
  {
    path: ['eraserWidth'],
    label: 'حجم الممحاة',
    unit: 'thickness',
    min: 0.01,
    max: 0.12,
    step: 0.005,
  },
];

export const DRAWING_DEFAULTS = {
  penWidth: 0.012,
  /**
   * Deliberately much wider than the pen. Until this existed the eraser was
   * exactly pen-width, which made rubbing anything out on a phone a chore.
   */
  eraserWidth: 0.05,
} as const;

function readPath(source: unknown, path: readonly string[]): unknown {
  let node: unknown = source;
  for (const key of path) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  return node;
}

function writePath(target: Record<string, unknown>, path: readonly string[], value: unknown): void {
  let node = target;
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i] as string;
    const next = node[key];
    if (next === null || typeof next !== 'object') node[key] = {};
    node = node[key] as Record<string, unknown>;
  }
  node[path[path.length - 1] as string] = value;
}

/**
 * Merge a room's stored overrides over the defaults, keeping only values that
 * are (a) described by `fields` and (b) inside their bounds.
 *
 * Anything else in the stored object is ignored rather than trusted: a
 * settings node written by an older build, by hand, or by a client that
 * decided to be creative cannot introduce a key the game will later read.
 */
export function resolveSettings<T extends object>(
  defaults: T,
  overrides: unknown,
  fields: readonly Tunable[],
): T {
  const merged = structuredCloneish(defaults) as Record<string, unknown>;
  if (overrides === null || typeof overrides !== 'object') return merged as T;

  for (const field of fields) {
    const raw = readPath(overrides, field.path);
    if (typeof raw !== 'number' || !Number.isFinite(raw)) continue;

    const scale = UNIT_SCALE[field.unit];
    const min = field.min * scale;
    const max = field.max * scale;
    writePath(merged, field.path, Math.min(Math.max(raw, min), max));
  }

  return merged as T;
}

/** Small deep clone, so merging never mutates the frozen default objects. */
function structuredCloneish<T>(value: T): T {
  if (Array.isArray(value)) return value.map(structuredCloneish) as unknown as T;
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = structuredCloneish(child);
    }
    return out as T;
  }
  return value;
}
