import { GameButton } from '../../../design/components/GameButton';
import { PlayerAvatar } from '../../../design/components/PlayerAvatar';
import { Screen } from '../../../design/components/Screen';
import type { RoomPlayer } from '../../../engine/presence';

/**
 * المزوّر — scores.
 *
 * Shows what each player gained this round alongside their running total. The
 * delta is the interesting number — "+5" explains what just happened, while a
 * cumulative total alone tells nobody why they moved.
 *
 * Sorted by total, but without podium staging: this is a party game between
 * rounds, not a leaderboard screen, and the next round matters more than the
 * standings.
 */

export interface ResultScreenProps {
  players: Record<string, RoomPlayer>;
  /** Running totals after this round. */
  scores: Record<string, number>;
  /** Points gained this round. */
  delta: Record<string, number>;
  impostorId: string;
  word: string;
  caught: boolean;
  impostorGuessedWord: boolean;
  isHost: boolean;
  onNextRound: () => void;
  onBackToLobby: () => void;
  onChangeMode: () => void;
}

export function ResultScreen({
  players,
  scores,
  delta,
  impostorId,
  word,
  caught,
  impostorGuessedWord,
  isHost,
  onNextRound,
  onBackToLobby,
  onChangeMode,
}: ResultScreenProps) {
  const ranked = Object.values(players).sort(
    (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0),
  );

  return (
    <Screen
      footer={
        <>
          {isHost ? (
            <>
              <GameButton tone="primary" size="lg" block onClick={onNextRound}>
                جولة ثانية
              </GameButton>
              <button
                type="button"
                onClick={onChangeMode}
                className="min-h-tap font-body text-sm text-ink-soft underline underline-offset-4"
              >
                غيّر نمط اللعب
              </button>
            </>
          ) : (
            <p className="text-center font-body text-sm text-ink-soft">
              في انتظار المضيف
            </p>
          )}
          <button
            type="button"
            onClick={onBackToLobby}
            className="min-h-tap font-body text-sm text-ink-faint underline underline-offset-4"
          >
            رجوع للغرفة
          </button>
        </>
      }
    >
      <div className="flex flex-1 flex-col gap-4 py-3">
        <div className="rounded-md border-bold border-ink bg-paper-raised p-4 text-center">
          <p className="font-display text-xl text-ink">
            {caught ? 'أمسكتوا المزوّر' : 'المزوّر نجا'}
          </p>
          <p className="mt-1 font-body text-sm text-ink-soft">
            الكلمة كانت <span className="font-display text-ink">{word}</span>
          </p>
          {caught && (
            <p className="mt-1 font-body text-sm text-ink-soft">
              {impostorGuessedWord ? 'وعرف الكلمة بعدها' : 'وما عرف الكلمة'}
            </p>
          )}
        </div>

        <ul className="flex list-none flex-col gap-2 p-0">
          {ranked.map((player) => {
            const gained = delta[player.id] ?? 0;

            return (
              <li
                key={player.id}
                className="flex items-center gap-3 rounded-md border-thin border-ink-hairline bg-paper p-2"
              >
                <PlayerAvatar
                  characterId={player.characterId}
                  name={player.name}
                  size="sm"
                  showName={false}
                  pose={gained > 0 ? 'celebrating' : 'idle'}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-base text-ink">{player.name}</p>
                  {player.id === impostorId && (
                    <p className="truncate font-body text-xs text-tomato-deep">
                      كان المزوّر
                    </p>
                  )}
                </div>

                {/* The delta is why the total moved, so it reads first. */}
                <span
                  dir="ltr"
                  className={`shrink-0 font-display text-base tabular-nums ${
                    gained > 0 ? 'text-teal-deep' : 'text-ink-faint'
                  }`}
                >
                  {gained > 0 ? `+${gained}` : '0'}
                </span>
                <span dir="ltr" className="shrink-0 font-display text-xl tabular-nums text-ink">
                  {scores[player.id] ?? 0}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Screen>
  );
}
