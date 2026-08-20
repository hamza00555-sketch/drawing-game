import { describe, expect, it } from 'vitest';
import {
  DRAWING_DEFAULTS,
  DRAWING_TUNABLES,
  MODE_TUNABLES,
  UNIT_SCALE,
  resolveSettings,
  type TunableMode,
} from '../../shared/tunables';
import { DEFAULT_BALANCE } from '../config/balance';

const MODES: readonly TunableMode[] = [
  'mozawwer',
  'kammil',
  'mamnou3at',
  'mushtarak',
  'kanatEsh',
];

describe('resolveSettings', () => {
  it('returns the defaults untouched when a room has no overrides', () => {
    expect(resolveSettings(DRAWING_DEFAULTS, null, DRAWING_TUNABLES)).toEqual(DRAWING_DEFAULTS);
    expect(resolveSettings(DRAWING_DEFAULTS, undefined, DRAWING_TUNABLES)).toEqual(
      DRAWING_DEFAULTS,
    );
    expect(resolveSettings(DRAWING_DEFAULTS, {}, DRAWING_TUNABLES)).toEqual(DRAWING_DEFAULTS);
  });

  it('never mutates the defaults it was handed', () => {
    // The defaults are module-level constants shared by every room.
    const before = JSON.stringify(DRAWING_DEFAULTS);
    resolveSettings(DRAWING_DEFAULTS, { penWidth: 0.03 }, DRAWING_TUNABLES);
    expect(JSON.stringify(DRAWING_DEFAULTS)).toBe(before);
  });

  it('takes a value that is inside its bounds', () => {
    const out = resolveSettings(DRAWING_DEFAULTS, { penWidth: 0.02 }, DRAWING_TUNABLES);
    expect(out.penWidth).toBe(0.02);
  });

  it('clamps rather than rejects a value outside its bounds', () => {
    const field = DRAWING_TUNABLES.find((f) => f.path[0] === 'penWidth');
    if (!field) throw new Error('penWidth tunable missing');

    expect(resolveSettings(DRAWING_DEFAULTS, { penWidth: 999 }, DRAWING_TUNABLES).penWidth).toBe(
      field.max,
    );
    expect(resolveSettings(DRAWING_DEFAULTS, { penWidth: -5 }, DRAWING_TUNABLES).penWidth).toBe(
      field.min,
    );
  });

  it('ignores anything that is not a finite number', () => {
    for (const bad of ['30', null, {}, [], NaN, Infinity, true]) {
      const out = resolveSettings(
        DRAWING_DEFAULTS,
        { penWidth: bad },
        DRAWING_TUNABLES,
      );
      expect(out.penWidth).toBe(DRAWING_DEFAULTS.penWidth);
    }
  });

  it('ignores keys that are not declared tunable', () => {
    // A settings node written by an older build, or by hand, must not be able
    // to introduce a field the game will later read.
    const out = resolveSettings(
      DRAWING_DEFAULTS,
      { penWidth: 0.02, somethingElse: 5 },
      DRAWING_TUNABLES,
    ) as Record<string, unknown>;
    expect(out.somethingElse).toBeUndefined();
  });

  it('reaches nested paths, which is how the Duo values are stored', () => {
    const out = resolveSettings(
      DEFAULT_BALANCE.kammil,
      { duo: { turnMs: 9_000 } },
      MODE_TUNABLES.kammil,
    );
    expect(out.duo.turnMs).toBe(9_000);
    // Siblings survive the merge.
    expect(out.duo.stages).toBe(DEFAULT_BALANCE.kammil.duo.stages);
    expect(out.countdownMs).toBe(DEFAULT_BALANCE.kammil.countdownMs);
  });
});

describe('tunable declarations', () => {
  it('every mode has tunables, and every one names a real default', () => {
    for (const mode of MODES) {
      const fields = MODE_TUNABLES[mode];
      expect(fields.length).toBeGreaterThan(0);

      for (const field of fields) {
        let node: unknown = DEFAULT_BALANCE[mode];
        for (const key of field.path) {
          expect(node).toBeTypeOf('object');
          node = (node as Record<string, unknown>)[key];
        }
        // A tunable pointing at nothing would render a control that silently
        // does not affect the game.
        expect(typeof node).toBe('number');
      }
    }
  });

  it('every default sits inside its own declared bounds', () => {
    for (const mode of MODES) {
      for (const field of MODE_TUNABLES[mode]) {
        let node: unknown = DEFAULT_BALANCE[mode];
        for (const key of field.path) node = (node as Record<string, unknown>)[key];

        const scale = UNIT_SCALE[field.unit];
        expect(node as number).toBeGreaterThanOrEqual(field.min * scale);
        expect(node as number).toBeLessThanOrEqual(field.max * scale);
      }
    }
  });

  it('the drawing defaults sit inside their bounds too', () => {
    for (const field of DRAWING_TUNABLES) {
      const value = (DRAWING_DEFAULTS as Record<string, number>)[field.path[0] as string];
      expect(value).toBeGreaterThanOrEqual(field.min);
      expect(value).toBeLessThanOrEqual(field.max);
    }
  });

  it('gives the eraser a wider default than the pen', () => {
    // The whole reason the setting exists: a rubber the exact width of the pen
    // is miserable to use.
    expect(DRAWING_DEFAULTS.eraserWidth).toBeGreaterThan(DRAWING_DEFAULTS.penWidth);
  });
});
