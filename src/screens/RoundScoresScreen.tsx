import { GameButton } from '../design/components/GameButton';
import { PlayerAvatar } from '../design/components/PlayerAvatar';
import { Screen } from '../design/components/Screen';
import type { RoomPlayer } from '../engine/presence';

/**
 * Scores between rounds, for the modes whose ending is the drawing itself.
 *
 * المزوّر and الممنوعات have their own result screens because their endings are
 * a verdict — who the impostor was, which word survived. كمّل رسمتي, الرسم
 * المشترك and كانت إيش؟ have already delivered their payoff on the previous
 * screen (the replay, the reveal, the poster), so this one only has to answer
 * "what did that earn me" and get out of the way.
 *
 * The delta is the number that reads first. A running total tells nobody why it
 * moved.
 */

export interface RoundScoresScreenProps {
  /** One line naming what just happened. */
  headline: string;
  detail?: string;
  players: Record<string, RoomPlayer>;
  scores: Record<string, number>;
  delta: Record<string, number>;
  isHost: boolean;
  onNextRound: () => void;
  onBackToLobby: () => void;
}

export function RoundScoresScreen({
  headline,
  detail,
  players,
  scores,
  delta,
  isHost,
  onNextRound,
  onBackToLobby,
}: RoundScoresScreenProps) {
  const ranked = Object.values(players).sort(
    (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0),
  );

  return (
    <Screen
      footer={
        <>
          {isHost ? (
            <GameButton tone="primary" size="lg" block onClick={onNextRound}>
              جولة ثانية
            </GameButton>
          ) : (
            <p className="text-center font-body text-sm text-ink-soft">في انتظار المضيف</p>
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
          <p className="font-display text-xl text-ink">{headline}</p>
          {detail && <p className="mt-1 font-body text-sm text-ink-soft">{detail}</p>}
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

                <p className="min-w-0 flex-1 truncate font-body text-base text-ink">
                  {player.name}
                </p>

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
