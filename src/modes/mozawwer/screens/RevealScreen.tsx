import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AssetSlot } from '../../../assets/AssetSlot';
import { PlayerAvatar } from '../../../design/components/PlayerAvatar';
import { Screen } from '../../../design/components/Screen';
import type { RoomPlayer } from '../../../engine/presence';

/**
 * المزوّر — the unmasking.
 *
 * The payoff of the whole mode, so it is staged in beats rather than dumped at
 * once: the accusation lands, a pause, then the truth. Revealing everything on
 * arrival throws away the only genuinely suspenseful second in the round.
 *
 * Under reduced-motion the beats still happen — they are pacing, not decoration
 * — they just arrive without the movement.
 */

export interface RevealScreenProps {
  players: Record<string, RoomPlayer>;
  /** Who the room accused. Undefined when the vote tied. */
  accusedId: string | undefined;
  impostorId: string;
  /** Revealed to everyone at this point, including the impostor. */
  word: string;
  voteCounts: Record<string, number>;
}

type Beat = 'accusation' | 'truth';

export function RevealScreen({
  players,
  accusedId,
  impostorId,
  word,
  voteCounts,
}: RevealScreenProps) {
  const [beat, setBeat] = useState<Beat>('accusation');
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(() => setBeat('truth'), reduceMotion ? 900 : 2200);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  const accused = accusedId ? players[accusedId] : undefined;
  const impostor = players[impostorId];
  const caught = accusedId === impostorId;

  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        {beat === 'accusation' ? (
          <>
            <p className="font-body text-base text-ink-soft">الغرفة تتهم</p>

            <motion.div
              initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            >
              {accused ? (
                <PlayerAvatar
                  characterId={accused.characterId}
                  name={accused.name}
                  pose="being_accused"
                  size="lg"
                />
              ) : (
                <p className="font-display text-2xl text-ink">ما اتفقتوا</p>
              )}
            </motion.div>

            {accusedId && (
              <p className="font-body text-sm text-ink-faint">
                {voteCounts[accusedId] ?? 0} أصوات
              </p>
            )}
          </>
        ) : (
          <>
            <motion.p
              initial={reduceMotion ? false : { y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`font-display text-3xl ${caught ? 'text-teal-deep' : 'text-tomato-deep'}`}
            >
              {caught ? 'أمسكناك' : 'المزوّر نجا'}
            </motion.p>

            <motion.div
              initial={reduceMotion ? false : { scale: 0.6, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 14 }}
              className="flex flex-col items-center gap-2"
            >
              {impostor && (
                <PlayerAvatar
                  characterId={impostor.characterId}
                  name={impostor.name}
                  pose={caught ? 'being_accused' : 'proud'}
                  size="lg"
                />
              )}
              <p className="font-body text-base text-ink-soft">كان هو المزوّر</p>
            </motion.div>

            <AssetSlot
              id={caught ? 'unmask_impostor' : 'accusation_group'}
              alt=""
              decorative
              className="h-24 w-auto object-contain"
            />

            <div className="rounded-md border-thin border-ink-hairline bg-paper-raised px-5 py-3">
              <p className="font-body text-sm text-ink-soft">الكلمة كانت</p>
              <p className="font-display text-2xl text-ink">{word}</p>
            </div>
          </>
        )}
      </div>
    </Screen>
  );
}
