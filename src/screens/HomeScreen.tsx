import { AssetSlot } from '../assets/AssetSlot';
import { GameButton } from '../design/components/GameButton';
import { Screen } from '../design/components/Screen';

/**
 * Home.
 *
 * Two actions and one picture. The hero is not decoration — it is the pitch:
 * the cast staring at one baffling drawing IS the phrase «وش ذا؟», so a new
 * player understands the game before reading a word.
 *
 * Deliberately not filled with buttons and options. Settings stay secondary
 * and quiet.
 */

export interface HomeScreenProps {
  onCreate: () => void;
  onJoin: () => void;
  onSettings?: () => void;
}

export function HomeScreen({ onCreate, onJoin, onSettings }: HomeScreenProps) {
  return (
    <Screen
      footer={
        <>
          <GameButton tone="primary" size="lg" block onClick={onCreate}>
            ابدأ اللعب
          </GameButton>
          <GameButton tone="secondary" size="md" block onClick={onJoin}>
            انضم بكود
          </GameButton>

          {onSettings && (
            <button
              type="button"
              onClick={onSettings}
              className="min-h-tap font-body text-sm text-ink-faint underline underline-offset-4"
            >
              الإعدادات
            </button>
          )}
        </>
      }
    >
      {/*
       * Wordmark and hero are one unit, centred together. Letting the image
       * stretch to `flex-1` instead just moves the dead space inside the image
       * box — `object-contain` then centres the artwork in a container far
       * taller than the art, and the gap reappears above it.
       *
       * The wordmark is hand-lettered art rather than type (ART_BIBLE.md §19),
       * so it is an image — but it still carries the game's name as its alt
       * text, and an <h1> wraps it so the page keeps a real heading.
       */}
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <h1 className="w-full">
          <AssetSlot
            id="logo_wordmark"
            priority
            className="mx-auto max-h-[26vh] w-auto max-w-[72%] object-contain"
          />
        </h1>

        <AssetSlot
          id="hero_home_confused_group"
          alt="مجموعة شخصيات تحاول فهم رسمة غريبة"
          priority
          className="max-h-[38vh] w-full object-contain"
        />
      </div>
    </Screen>
  );
}
