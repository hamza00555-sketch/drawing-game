import { useState, type FormEvent } from 'react';
import { GameButton } from '../../../design/components/GameButton';
import { Screen } from '../../../design/components/Screen';
import { StaticDrawing } from '../../../design/components/StaticDrawing';
import { TextField } from '../../../design/components/TextField';
import { Timer } from '../../../design/components/Timer';
import type { Stroke } from '../../../engine/canvas/strokes';

/**
 * الرسم المشترك — the guess.
 *
 * Two framings, because the mode asks a different question depending on how
 * many people are in the room:
 *
 *   group  everyone who did not draw names the whole combined idea
 *   duo    each of the two artists names the HALF their partner was holding
 *
 * The duo wording matters. "وش ذا؟" would be wrong there — the player already
 * knows their own half, and is being asked for the other one specifically.
 */

export interface MushtarakGuessScreenProps {
  /** Whether THIS player is one of the people answering. */
  canGuess: boolean;
  isDuo?: boolean;
  /** Duo only: whose half this player is naming. */
  partnerName?: string;
  /** Shown to anyone who is only watching. */
  watchingName: string;
  strokes: readonly Stroke[];
  endsAt: number | null | undefined;
  durationMs: number;
  onGuess: (guess: string) => void;
  submitted?: boolean;
}

export function MushtarakGuessScreen({
  canGuess,
  isDuo = false,
  partnerName,
  watchingName,
  strokes,
  endsAt,
  durationMs,
  onGuess,
  submitted = false,
}: MushtarakGuessScreenProps) {
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
          canGuess ? (
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
              {watchingName} يحاول يفهمها
            </p>
          )
        }
      >
        <div className="flex flex-1 flex-col gap-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-2xl text-ink">
              {isDuo ? 'وش كان نصّه؟' : 'وش ذا؟'}
            </h1>
            <Timer endsAt={endsAt} durationMs={durationMs} className="max-w-[10rem]" />
          </div>

          {isDuo && canGuess && (
            <p className="font-body text-sm text-ink-soft">
              أنت تعرف نصّك. خمّن النص الثاني اللي كان مع{' '}
              <span className="font-display text-ink">{partnerName}</span>.
            </p>
          )}

          {/* relative + real height: StaticDrawing fills it absolutely. */}
          <div className="relative min-h-0 flex-1 rounded-md border-bold border-ink">
            <StaticDrawing strokes={strokes} />
          </div>

          {canGuess && (
            <TextField
              label={isDuo ? 'نصّه' : 'تخمينك'}
              value={guess}
              onChange={(event) => setGuess(event.target.value)}
              maxLength={40}
              disabled={submitted}
              placeholder={isDuo ? 'وش كان يرسم؟' : 'وش تشوفها؟'}
            />
          )}
        </div>
      </Screen>
    </form>
  );
}
