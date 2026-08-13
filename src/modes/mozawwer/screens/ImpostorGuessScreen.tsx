import { useState, type FormEvent } from 'react';
import { GameButton } from '../../../design/components/GameButton';
import { Screen } from '../../../design/components/Screen';
import { TextField } from '../../../design/components/TextField';
import { Timer } from '../../../design/components/Timer';

/**
 * المزوّر — the caught impostor's last chance.
 *
 * They watched a whole drawing appear without knowing what it was. If they can
 * still name it, that deserves points back — it turns being caught from a dead
 * end into one more thing to play for.
 *
 * Only the impostor sees the input; everyone else watches the same countdown so
 * the moment stays shared rather than becoming a private pause.
 */

export interface ImpostorGuessScreenProps {
  isImpostor: boolean;
  impostorName: string;
  endsAt: number | null | undefined;
  durationMs: number;
  onGuess: (guess: string) => void;
  submitted?: boolean;
}

export function ImpostorGuessScreen({
  isImpostor,
  impostorName,
  endsAt,
  durationMs,
  onGuess,
  submitted = false,
}: ImpostorGuessScreenProps) {
  const [guess, setGuess] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (guess.trim().length === 0 || submitted) return;
    onGuess(guess);
  }

  if (!isImpostor) {
    return (
      <Screen>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <h1 className="font-display text-2xl text-ink">فرصة أخيرة</h1>
          <p className="font-body text-base text-ink-soft">
            {impostorName} يحاول يخمّن الكلمة
          </p>
          <Timer endsAt={endsAt} durationMs={durationMs} className="w-full max-w-[16rem]" />
        </div>
      </Screen>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="contents">
      <Screen
        footer={
          <GameButton
            tone="primary"
            size="lg"
            block
            type="submit"
            disabled={submitted || guess.trim().length === 0}
          >
            {submitted ? 'أرسلناها' : 'خمّن'}
          </GameButton>
        }
      >
        <div className="flex flex-1 flex-col justify-center gap-4">
          <div className="text-center">
            <h1 className="font-display text-2xl text-ink">انكشفت</h1>
            <p className="mt-1 font-body text-base text-ink-soft">
              بس لو عرفت الكلمة ترجع لك نقاط
            </p>
          </div>

          <Timer endsAt={endsAt} durationMs={durationMs} />

          <TextField
            label="وش كانت الكلمة؟"
            value={guess}
            onChange={(event) => setGuess(event.target.value)}
            maxLength={40}
            autoFocus
            disabled={submitted}
            placeholder="اكتب تخمينك"
          />
        </div>
      </Screen>
    </form>
  );
}
