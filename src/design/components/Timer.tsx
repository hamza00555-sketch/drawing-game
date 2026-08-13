import { useEffect, useRef, useState } from 'react';
import { msUntil } from '../../engine/clock';

/**
 * Phase countdown.
 *
 * Reads a server-stamped deadline through the synced clock, never the device
 * clock. Every device therefore shows the same number, which is the only way a
 * two-second turn can be fair across a room of phones whose clocks disagree.
 *
 * The bar is the primary read and the digits are secondary: under time pressure
 * a shrinking bar is understood faster than a changing number.
 */

export interface TimerProps {
  /** Server-stamped deadline, in server epoch ms. */
  endsAt: number | null | undefined;
  /** Full duration of the phase, used to scale the bar. */
  durationMs: number;
  onExpire?: () => void;
  /** Hide the digits for very short phases, where they only flicker. */
  showDigits?: boolean;
  className?: string;
}

export function Timer({
  endsAt,
  durationMs,
  onExpire,
  showDigits = true,
  className = '',
}: TimerProps) {
  const [remaining, setRemaining] = useState(() => msUntil(endsAt));
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
  }, [endsAt]);

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      const left = msUntil(endsAt);
      setRemaining(left);

      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpire?.();
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [endsAt, onExpire]);

  const fraction = durationMs > 0 ? Math.min(1, Math.max(0, remaining / durationMs)) : 0;
  const seconds = Math.ceil(remaining / 1000);
  // Urgency threshold scales with the phase: 5s is nothing in a 60s round but
  // is the entire turn in كمّل رسمتي.
  const urgent = remaining <= Math.min(5000, durationMs * 0.25);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="h-3 flex-1 overflow-hidden rounded-pill border-thin border-ink bg-paper-sunken"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={Math.round(durationMs / 1000)}
        aria-valuenow={seconds}
        aria-label="الوقت المتبقي"
      >
        <div
          className={`h-full rounded-pill ${urgent ? 'bg-tomato' : 'bg-ink'}`}
          // Width is set inline because it changes every frame; a transition
          // here would lag behind the real remaining time.
          style={{ width: `${fraction * 100}%` }}
        />
      </div>

      {showDigits && (
        <span
          dir="ltr"
          className={`min-w-[2.5ch] text-center font-display text-lg tabular-nums ${
            urgent ? 'text-tomato-deep' : 'text-ink'
          }`}
        >
          {seconds}
        </span>
      )}
    </div>
  );
}
