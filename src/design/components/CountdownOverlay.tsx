import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AssetSlot } from '../../assets/AssetSlot';
import { msUntil } from '../../engine/clock';

/**
 * 3-2-1 countdown.
 *
 * The number is derived from the server-stamped deadline every frame, not from
 * a local interval. With a three-second countdown followed by as little as two
 * seconds of drawing, a device counting on its own would start its player's
 * turn at a visibly different moment from everyone else's.
 *
 * Each beat is a character reaction, not a bare digit: the artist sees the
 * drawing, grabs the pen, braces. That is the brief's requirement and it is
 * also the only thing that makes a three-second wait entertaining.
 */

const BEATS: Record<number, { asset: string; caption: string }> = {
  3: { asset: 'countdown_3_surprised', caption: 'شوف الرسمة' },
  2: { asset: 'countdown_2_grabs_pen', caption: 'امسك القلم' },
  1: { asset: 'countdown_1_ready', caption: 'جهّز' },
};

export interface CountdownOverlayProps {
  /** Server-stamped moment the pen unlocks. */
  endsAt: number | null | undefined;
  onComplete?: () => void;
}

export function CountdownOverlay({ endsAt, onComplete }: CountdownOverlayProps) {
  const [beat, setBeat] = useState(3);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let raf = 0;
    let done = false;

    const tick = () => {
      const left = msUntil(endsAt);
      const next = left <= 0 ? 0 : Math.min(3, Math.ceil(left / 1000));
      setBeat(next);

      if (next === 0 && !done) {
        done = true;
        onComplete?.();
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [endsAt, onComplete]);

  if (beat === 0) return null;
  const current = BEATS[beat];

  return (
    <div className="wt-scrim absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-md">
      <AnimatePresence mode="wait">
        <motion.div
          key={beat}
          initial={reduceMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
          animate={reduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { scale: 1.4, opacity: 0 }}
          /*
           * Each beat lives for one second, so the entrance must settle in a
           * fraction of that. A springy 600ms entrance leaves the number
           * fading in for most of its life and it never reads as solid — the
           * opposite of what a countdown needs to communicate.
           */
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-2"
        >
          <span dir="ltr" className="font-display text-hero leading-none text-ink">
            {beat}
          </span>
          {current && (
            <>
              <AssetSlot
                id={current.asset}
                alt=""
                decorative
                className="h-24 w-auto object-contain"
              />
              <span className="font-body text-base text-ink-soft">{current.caption}</span>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
