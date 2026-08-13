import { useState, type FormEvent } from 'react';
import { GameButton } from '../../../design/components/GameButton';
import { Screen } from '../../../design/components/Screen';
import { TextField } from '../../../design/components/TextField';
import { Timer } from '../../../design/components/Timer';
import type { Stroke } from '../../../engine/canvas/strokes';
import { StaticDrawing } from '../../../design/components/StaticDrawing';

/**
 * كمّل رسمتي — the guess.
 *
 * The guesser finally gets to look properly at a drawing built by people who
 * had three seconds each, and answer the question the game is named after.
 *
 * Everyone else watches the same drawing and the same countdown. They know the
 * word; the comedy is watching someone try to reach it from that.
 */

export interface KammilGuessScreenProps {
  isGuesser: boolean;
  guesserName: string;
  strokes: readonly Stroke[];
  endsAt: number | null | undefined;
  durationMs: number;
  onGuess: (guess: string) => void;
  submitted?: boolean;
}

export function KammilGuessScreen({
  isGuesser,
  guesserName,
  strokes,
  endsAt,
  durationMs,
  onGuess,
  submitted = false,
}: KammilGuessScreenProps) {
  const [guess, setGuess] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (guess.trim().length === 0 || submitted) return;
    onGuess(guess);
  }

  return (
    <form onSubmit={handleSubmit} className="contents">
      <Screen
        footer={
          isGuesser ? (
            <GameButton
              tone="primary"
              size="lg"
              block
              type="submit"
              disabled={submitted || guess.trim().length === 0}
            >
              {submitted ? 'أرسلناها' : 'هذا جوابي'}
            </GameButton>
          ) : (
            <p className="text-center font-body text-sm text-ink-soft">
              {guesserName} يحاول يفهمها
            </p>
          )
        }
      >
        <div className="flex flex-1 flex-col gap-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-2xl text-ink">وش ذا؟</h1>
            <Timer endsAt={endsAt} durationMs={durationMs} className="max-w-[10rem]" />
          </div>

          {/* relative + real height: StaticDrawing fills it absolutely. */}
          <div className="relative min-h-0 flex-1 rounded-md border-bold border-ink">
            <StaticDrawing strokes={strokes} />
          </div>

          {isGuesser && (
            <TextField
              label="تخمينك"
              value={guess}
              onChange={(event) => setGuess(event.target.value)}
              maxLength={40}
              disabled={submitted}
              placeholder="وش تشوفها؟"
            />
          )}
        </div>
      </Screen>
    </form>
  );
}
