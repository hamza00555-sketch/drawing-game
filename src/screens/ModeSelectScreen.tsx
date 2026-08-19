import { AssetSlot } from '../assets/AssetSlot';
import { GameButton } from '../design/components/GameButton';
import { Screen } from '../design/components/Screen';
import type { GameMode } from '../engine/room';

/**
 * Mode selection.
 *
 * Not a grid of icons, and not five identical cards either. Playable modes get
 * a large scene that shows the idea happening — a creature sweating while the
 * others draw confidently explains المزوّر faster than a sentence does. Modes
 * that are not built yet are demoted to a compact strip below, so the screen
 * has a real hierarchy instead of a uniform stack where everything competes.
 *
 * The copy under each scene is one line. If a scene needs a paragraph to be
 * understood, the scene has failed and gets regenerated, not explained.
 */

interface ModeEntry {
  id: GameMode;
  name: string;
  line: string;
  asset: string;
  ready: boolean;
  /** Fewest connected players this mode can start with. */
  minPlayers: number;
}

const MODES: readonly ModeEntry[] = [
  {
    id: 'mozawwer',
    name: 'المزوّر',
    line: 'واحد بينكم ما يعرف الكلمة. لقّطوه.',
    asset: 'mode_scene_mozawwer',
    ready: true,
    // No Duo ruleset — with one guesser and one impostor, the impostor is
    // identified by elimination the instant the round starts.
    minPlayers: 3,
  },
  {
    id: 'kammil',
    name: 'كمّل رسمتي',
    line: 'ثواني معدودة لكل واحد، والأخير يخمّن.',
    asset: 'mode_scene_kammil',
    ready: true,
    minPlayers: 2,
  },
  {
    id: 'mamnou3at',
    name: 'الممنوعات',
    line: 'ارسمها، بس بدون أهم أجزائها.',
    asset: 'mode_scene_mamnou3at',
    ready: true,
    minPlayers: 2,
  },
  {
    id: 'mushtarak',
    name: 'الرسم المشترك',
    line: 'اثنين يرسمون، وكل واحد يعرف نص القصة.',
    asset: 'mode_scene_mushtarak',
    ready: true,
    minPlayers: 2,
  },
  {
    id: 'kanatEsh',
    name: 'كانت إيش؟',
    line: 'جملة تتحول لرسمة، والرسمة تتحول لكارثة.',
    asset: 'mode_scene_kanat_esh',
    ready: true,
    minPlayers: 2,
  },
];

/**
 * The single source both `ModeSelectScreen` and `LobbyScreen` read for "can
 * this room start this mode right now" — one lookup, not two independently
 * maintained copies of the same five numbers.
 */
export const MODE_MIN_PLAYERS: Record<GameMode, number> = Object.fromEntries(
  MODES.map((mode) => [mode.id, mode.minPlayers]),
) as Record<GameMode, number>;

export interface ModeSelectScreenProps {
  selected?: GameMode;
  onSelect: (mode: GameMode) => void;
  onConfirm: () => void;
  onBack: () => void;
  /** How many players are connected right now — decides which modes are locked. */
  connectedPlayerCount: number;
}

export function ModeSelectScreen({
  selected,
  onSelect,
  onConfirm,
  onBack,
  connectedPlayerCount,
}: ModeSelectScreenProps) {
  const playable = MODES.filter(
    (mode) => mode.ready && connectedPlayerCount >= mode.minPlayers,
  );
  const locked = MODES.filter(
    (mode) => mode.ready && connectedPlayerCount < mode.minPlayers,
  );
  const upcoming = MODES.filter((mode) => !mode.ready);

  return (
    <Screen
      footer={
        <>
          <GameButton tone="primary" size="lg" block disabled={!selected} onClick={onConfirm}>
            يلا نلعب
          </GameButton>
          <button
            type="button"
            onClick={onBack}
            className="min-h-tap font-body text-sm text-ink-faint underline underline-offset-4"
          >
            رجوع
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5 py-4">
        <h1 className="font-display text-2xl text-ink">وش نلعب؟</h1>

        <ul className="flex list-none flex-col gap-4 p-0">
          {playable.map((mode) => {
            const isSelected = mode.id === selected;

            return (
              <li key={mode.id}>
                <button
                  type="button"
                  onClick={() => onSelect(mode.id)}
                  aria-pressed={isSelected}
                  className={[
                    'flex w-full flex-col overflow-hidden rounded-lg border-bold text-start',
                    'transition-[transform,box-shadow] duration-fast ease-bounce',
                    'active:translate-y-[2px] active:shadow-pressed',
                    isSelected
                      ? // The chosen mode leans off-axis, like a card tossed on
                        // the table. It is the one hand-made cue that reads
                        // instantly without another border colour.
                        'border-ink bg-paper-raised shadow-3 -rotate-[0.6deg]'
                      : 'border-ink-hairline bg-paper shadow-none',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex w-full items-center justify-center px-3 pt-3',
                      isSelected ? 'bg-paper-raised' : 'bg-paper',
                    ].join(' ')}
                  >
                    <AssetSlot
                      id={mode.asset}
                      alt={mode.name}
                      className="h-28 w-full object-contain"
                    />
                  </span>

                  <span className="flex flex-col gap-1 p-3">
                    <span className="font-display text-xl text-ink">{mode.name}</span>
                    <span className="font-body text-sm leading-snug text-ink-soft">
                      {mode.line}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {locked.length > 0 && (
          <ul className="flex list-none flex-col gap-4 p-0">
            {locked.map((mode) => (
              <li key={mode.id}>
                <div
                  aria-disabled
                  className={[
                    'flex w-full flex-col overflow-hidden rounded-lg border-bold text-start',
                    'border-ink-hairline bg-paper opacity-60',
                  ].join(' ')}
                >
                  <span className="flex w-full items-center justify-center bg-paper px-3 pt-3">
                    <AssetSlot
                      id={mode.asset}
                      alt={mode.name}
                      className="h-28 w-full object-contain"
                    />
                  </span>

                  <span className="flex flex-col gap-1 p-3">
                    <span className="font-display text-xl text-ink">{mode.name}</span>
                    <span className="font-body text-sm leading-snug text-tomato-deep">
                      يحتاج {mode.minPlayers} لاعبين
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {upcoming.length > 0 && (
          <section>
            <h2 className="font-display text-base text-ink-soft">قريبًا</h2>

            <ul className="mt-2 flex list-none flex-col gap-2 p-0">
              {upcoming.map((mode) => (
                <li
                  key={mode.id}
                  className="flex items-center gap-3 rounded-md border-thin border-ink-hairline px-3 py-2"
                >
                  <AssetSlot
                    id={mode.asset}
                    alt=""
                    decorative
                    className="h-10 w-16 shrink-0 object-contain opacity-70"
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="font-display text-base text-ink-soft">{mode.name}</span>
                    <span className="truncate font-body text-xs text-ink-faint">
                      {mode.line}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Screen>
  );
}
