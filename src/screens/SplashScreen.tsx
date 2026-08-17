import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AssetSlot } from '../assets/AssetSlot';

/**
 * Splash.
 *
 * One job: say the name with personality, then get out of the way. It holds
 * briefly and hands over automatically — a party game should never make five
 * people wait on a logo.
 *
 * The wordmark animates in with anticipation and overshoot rather than a fade,
 * because a fade is the one motion that tells the player nothing about what
 * kind of game this is.
 */

export interface SplashScreenProps {
  onDone: () => void;
  holdMs?: number;
}

export function SplashScreen({ onDone, holdMs = 1600 }: SplashScreenProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(onDone, reduceMotion ? 400 : holdMs);
    return () => window.clearTimeout(timer);
  }, [onDone, holdMs, reduceMotion]);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label="تخطي"
      className="wt-screen wt-paper-ground w-full cursor-default items-center justify-center border-0 p-0"
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        {/*
         * The wordmark is generated art, not type (ART_BIBLE.md §19), so the
         * entrance animates the image itself. It still lands as an <h1> for
         * anything reading the page rather than looking at it.
         */}
        <motion.h1
          initial={reduceMotion ? false : { scale: 0.7, rotate: -4, opacity: 0 }}
          animate={{ scale: 1, rotate: -2, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14 }}
          className="w-full"
        >
          <AssetSlot
            id="logo_wordmark"
            priority
            className="mx-auto w-full max-w-[17rem] object-contain"
          />
        </motion.h1>

        <motion.div
          initial={reduceMotion ? false : { y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.18, type: 'spring', stiffness: 200, damping: 18 }}
          className="w-full max-w-[18rem]"
        >
          <AssetSlot id="splash_backdrop" decorative priority className="w-full" />
        </motion.div>
      </div>
    </button>
  );
}
