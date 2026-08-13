import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AssetSlot } from '../../../assets/AssetSlot';
import { GameButton } from '../../../design/components/GameButton';
import { Screen } from '../../../design/components/Screen';

/**
 * Role reveal.
 *
 * The one screen where five people are holding five phones in the same room, so
 * it is built for shoulder-surfing: nothing secret is on screen until the player
 * deliberately holds the card, and it hides again the moment they let go.
 *
 * The impostor's payload genuinely does not contain the word — this component
 * cannot leak it because it was never sent. See ARCHITECTURE.md §3.
 */

export interface RoleRevealScreenProps {
  /** Undefined for the impostor — the key does not exist in their payload. */
  word?: string;
  isImpostor: boolean;
  onReady: () => void;
  /** True once this player has confirmed; used to show a waiting state. */
  waiting?: boolean;
}

export function RoleRevealScreen({
  word,
  isImpostor,
  onReady,
  waiting = false,
}: RoleRevealScreenProps) {
  const [held, setHeld] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <Screen
      footer={
        <GameButton tone="primary" size="lg" block onClick={onReady} disabled={waiting}>
          {waiting ? 'في انتظار البقية...' : 'جاهز'}
        </GameButton>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <p className="font-body text-base text-ink-soft">
          {isImpostor ? 'دورك السري' : 'المطلوب ترسمه'}
        </p>

        {/*
         * Press-and-hold rather than tap-to-toggle. A toggle leaves the secret
         * on screen while the player looks up at the room, which is exactly
         * when someone else reads it.
         */}
        <motion.button
          type="button"
          onPointerDown={() => setHeld(true)}
          onPointerUp={() => setHeld(false)}
          onPointerLeave={() => setHeld(false)}
          onPointerCancel={() => setHeld(false)}
          animate={
            reduceMotion ? {} : { scale: held ? 1.02 : 1, rotate: held ? 0 : -1.2 }
          }
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex min-h-[13rem] w-full max-w-[20rem] touch-none select-none flex-col items-center justify-center gap-3 rounded-lg border-heavy border-ink bg-paper-raised p-5 shadow-3"
        >
          {held ? (
            isImpostor ? (
              <>
                <span className="font-display text-2xl text-tomato-deep">أنت المزوّر</span>
                <span className="font-body text-base text-ink-soft">مثّل إنك فاهم</span>
                <AssetSlot
                  id="reveal_role_impostor"
                  alt=""
                  decorative
                  className="h-20 w-auto object-contain"
                />
              </>
            ) : (
              <>
                <span className="font-body text-sm text-ink-soft">ارسم</span>
                <span className="font-display text-3xl text-ink">{word}</span>
              </>
            )
          ) : (
            <>
              <span className="font-display text-xl text-ink">اضغط مع الاستمرار</span>
              <span className="font-body text-sm text-ink-soft">
                خلّ أحد ما يشوف شاشتك
              </span>
            </>
          )}
        </motion.button>

        {!isImpostor && (
          <p className="font-body text-sm text-ink-faint">
            واحد بينكم ما يعرف الكلمة
          </p>
        )}
      </div>
    </Screen>
  );
}
