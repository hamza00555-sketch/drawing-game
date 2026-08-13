import { GameButton } from '../../../design/components/GameButton';
import { Screen } from '../../../design/components/Screen';
import { Timer } from '../../../design/components/Timer';

/**
 * الممنوعات — the artist's brief.
 *
 * Shown only to the artist, before the clock starts. The forbidden list needs
 * a moment of undistracted reading: the whole round depends on the artist
 * actually internalising which three features are off-limits, and discovering
 * them mid-drawing would waste the timer.
 *
 * Everyone else waits on a screen that deliberately reveals nothing.
 */

export interface MamnouBriefScreenProps {
  isArtist: boolean;
  artistName: string;
  word: string;
  forbidden: readonly string[];
  endsAt: number | null | undefined;
  durationMs: number;
  onReady: () => void;
}

export function MamnouBriefScreen({
  isArtist,
  artistName,
  word,
  forbidden,
  endsAt,
  durationMs,
  onReady,
}: MamnouBriefScreenProps) {
  if (!isArtist) {
    return (
      <Screen>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <h1 className="font-display text-2xl text-ink">{artistName} يستعد</h1>
          <p className="font-body text-base text-ink-soft">
            بيرسم شي، وفيه أشياء ممنوع يرسمها
          </p>
          <Timer endsAt={endsAt} durationMs={durationMs} className="w-full max-w-[16rem]" />
        </div>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <GameButton tone="primary" size="lg" block onClick={onReady}>
          فهمت، يلا
        </GameButton>
      }
    >
      <div className="flex flex-1 flex-col justify-center gap-5">
        <div className="rounded-lg border-heavy border-ink bg-paper-raised p-5 text-center shadow-2">
          <p className="font-body text-sm text-ink-soft">ارسم</p>
          <p className="mt-1 font-display text-3xl text-ink">{word}</p>
        </div>

        <div className="rounded-md border-bold border-tomato bg-paper p-4">
          <p className="font-display text-lg text-tomato-deep">ممنوع ترسم</p>
          <ul className="mt-2 flex list-none flex-col gap-2 p-0">
            {forbidden.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 font-body text-base text-ink"
              >
                {/*
                 * A bar, not an icon: the "no" marker here is a functional UI
                 * element built in code, which the art rules allow. An emoji or
                 * an icon-pack glyph would not be.
                 */}
                <span className="h-1 w-4 shrink-0 rounded-pill bg-tomato" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Timer endsAt={endsAt} durationMs={durationMs} />
      </div>
    </Screen>
  );
}
