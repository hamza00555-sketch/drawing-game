import { useState } from 'react';
import { GameButton } from '../design/components/GameButton';
import { Screen } from '../design/components/Screen';
import {
  DRAWING_DEFAULTS,
  DRAWING_TUNABLES,
  MODE_TUNABLES,
  UNIT_SCALE,
  type Tunable,
  type TunableMode,
} from '../../shared/tunables';
import { DEFAULT_BALANCE } from '../config/balance';
import { isModeAvailable } from '../config/modes';

/**
 * Room settings — host only.
 *
 * Every control on this screen is generated from `shared/tunables.ts` rather
 * than hand-written, which is what keeps it honest: the same list gives the
 * screen its labels and bounds AND clamps the values server-side when a round
 * starts. Adding a tunable is one entry in that file, not a form field here
 * plus a validator there.
 *
 * Values are stored under `rooms/{roomId}/settings/{mode}` and the security
 * rules only accept them from the host, and only while no round is running —
 * so balance cannot be changed mid-round to swing an outcome.
 */

const MODE_NAMES: Record<TunableMode, string> = {
  mozawwer: 'المزوّر',
  kammil: 'كمّل رسمتي',
  mamnou3at: 'الممنوعات',
  mushtarak: 'الرسم المشترك',
  kanatEsh: 'كانت إيش؟',
};

/**
 * A mode out of rotation keeps its tunables — the server still clamps against
 * them, and any override the host set before is still stored — but it gets no
 * section here. Timers for a mode nobody can start are noise on a screen whose
 * whole job is finding the one number you came to change.
 */
const MODE_ORDER: readonly TunableMode[] = (
  ['mozawwer', 'kammil', 'mamnou3at', 'mushtarak', 'kanatEsh'] as const
).filter((mode) => isModeAvailable(mode));

export interface SettingsScreenProps {
  /** Current overrides, keyed by mode, plus a `drawing` section. */
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  onBack: () => void;
  /** Disabled with an explanation while a round is live. */
  locked?: boolean;
}

function readPath(source: unknown, path: readonly string[]): unknown {
  let node: unknown = source;
  for (const key of path) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  return node;
}

function withPath(
  source: Record<string, unknown>,
  path: readonly string[],
  value: number,
): Record<string, unknown> {
  const next = { ...source };
  let node: Record<string, unknown> = next;
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i] as string;
    const child = node[key];
    node[key] = child !== null && typeof child === 'object' ? { ...(child as object) } : {};
    node = node[key] as Record<string, unknown>;
  }
  node[path[path.length - 1] as string] = value;
  return next;
}

/** Turn a stored value into what the host reads: seconds, a count, or a scale. */
function display(raw: number, field: Tunable): string {
  if (field.unit === 'seconds') return `${Math.round(raw / UNIT_SCALE.seconds)} ث`;
  if (field.unit === 'thickness') {
    const steps = Math.round((raw - field.min) / field.step);
    const total = Math.round((field.max - field.min) / field.step);
    return `${steps + 1} / ${total + 1}`;
  }
  return String(raw);
}

function Row({
  field,
  raw,
  disabled,
  onSet,
}: {
  field: Tunable;
  raw: number;
  disabled: boolean;
  onSet: (next: number) => void;
}) {
  const scale = UNIT_SCALE[field.unit];
  const stepRaw = field.step * scale;
  const min = field.min * scale;
  const max = field.max * scale;

  // Floating-point steps (thickness) would drift on repeated +/-, so snap.
  const snap = (n: number) => Math.round(n / stepRaw) * stepRaw;
  const clamp = (n: number) => Math.min(Math.max(n, min), max);

  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="min-w-0 flex-1 font-body text-sm text-ink">{field.label}</span>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          disabled={disabled || raw <= min}
          aria-label={`أنقص ${field.label}`}
          onClick={() => onSet(clamp(snap(raw - stepRaw)))}
          className="min-h-tap w-tap wt-btn-sm wt-btn-secondary text-ink disabled:opacity-40"
        >
          −
        </button>

        <span
          dir="ltr"
          className="min-w-[3.5rem] text-center font-display text-base text-ink"
        >
          {display(raw, field)}
        </span>

        <button
          type="button"
          disabled={disabled || raw >= max}
          aria-label={`زد ${field.label}`}
          onClick={() => onSet(clamp(snap(raw + stepRaw)))}
          className="min-h-tap w-tap wt-btn-sm wt-btn-secondary text-ink disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function SettingsScreen({ value, onChange, onBack, locked = false }: SettingsScreenProps) {
  const [open, setOpen] = useState<string | undefined>(undefined);

  /** The effective value: the room's override if set, else the default. */
  function current(section: string, field: Tunable, defaults: unknown): number {
    const override = readPath(value[section], field.path);
    if (typeof override === 'number' && Number.isFinite(override)) return override;
    const fallback = readPath(defaults, field.path);
    return typeof fallback === 'number' ? fallback : field.min * UNIT_SCALE[field.unit];
  }

  function set(section: string, field: Tunable, next: number) {
    onChange({
      ...value,
      [section]: withPath((value[section] as Record<string, unknown>) ?? {}, field.path, next),
    });
  }

  function Section({
    id,
    title,
    fields,
    defaults,
  }: {
    id: string;
    title: string;
    fields: readonly Tunable[];
    defaults: unknown;
  }) {
    const isOpen = open === id;

    return (
      <section className="rounded-md border-thin border-ink-hairline bg-paper">
        <button
          type="button"
          onClick={() => setOpen(isOpen ? undefined : id)}
          aria-expanded={isOpen}
          className="flex min-h-tap w-full items-center justify-between px-3 py-2 text-start"
        >
          <span className="font-display text-lg text-ink">{title}</span>
          <span className="font-body text-sm text-ink-faint">{isOpen ? 'إخفاء' : 'تعديل'}</span>
        </button>

        {isOpen && (
          <div className="border-t-thin border-ink-hairline px-3 pb-3 pt-1">
            {fields.map((field) => (
              <Row
                key={field.path.join('.')}
                field={field}
                raw={current(id, field, defaults)}
                disabled={locked}
                onSet={(next) => set(id, field, next)}
              />
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <Screen
      footer={
        <>
          <GameButton
            tone="secondary"
            size="md"
            block
            disabled={locked}
            onClick={() => onChange({})}
          >
            رجّع كل شي للأصل
          </GameButton>
          <GameButton tone="primary" size="lg" block onClick={onBack}>
            تم
          </GameButton>
        </>
      }
    >
      <div className="flex flex-col gap-3 py-4">
        <h1 className="font-display text-2xl text-ink">إعدادات الغرفة</h1>

        {locked ? (
          <p className="font-body text-sm text-tomato-deep">
            ما تقدر تعدّل والجولة شغّالة. ارجع للوبي أول.
          </p>
        ) : (
          <p className="font-body text-sm text-ink-soft">
            التعديلات تنطبق على هذي الغرفة فقط، وتبدأ من الجولة الجاية.
          </p>
        )}

        <Section
          id="drawing"
          title="الرسم"
          fields={DRAWING_TUNABLES}
          defaults={DRAWING_DEFAULTS}
        />

        {MODE_ORDER.map((mode) => (
          <Section
            key={mode}
            id={mode}
            title={MODE_NAMES[mode]}
            fields={MODE_TUNABLES[mode]}
            defaults={DEFAULT_BALANCE[mode]}
          />
        ))}
      </div>
    </Screen>
  );
}
