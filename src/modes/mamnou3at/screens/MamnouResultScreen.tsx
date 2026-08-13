import { GameButton } from '../../../design/components/GameButton';
import { PlayerAvatar } from '../../../design/components/PlayerAvatar';
import { Screen } from '../../../design/components/Screen';
import { StaticDrawing } from '../../../design/components/StaticDrawing';
import type { Stroke } from '../../../engine/canvas/strokes';
import type { RoomPlayer } from '../../../engine/presence';

/**
 * الممنوعات — results.
 *
 * Leads with the drawing and the word together, because the joke only lands
 * once you can see what the artist was NOT allowed to use. The ranked list
 * comes second: who got there first is the competitive part, but the picture
 * is the entertainment.
 */

export interface MamnouResultScreenProps {
  word: string;
  forbidden: readonly string[];
  strokes: readonly Stroke[];
  players: Record<string, RoomPlayer>;
  artistId: string;
  /** Correct guessers in the order they got it. */
  ranked: readonly string[];
  scores: Record<string, number>;
  delta: Record<string, number>;
  isHost: boolean;
  onNextRound: () => void;
  onBackToLobby: () => void;
}

export function MamnouResultScreen({
  word,
  forbidden,
  strokes,
  players,
  artistId,
  ranked,
  scores,
  delta,
  isHost,
  onNextRound,
  onBackToLobby,
}: MamnouResultScreenProps) {
  const artist = players[artistId];

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
      <div className="flex flex-1 flex-col gap-3 py-2">
        <div className="text-center">
          <p className="font-body text-sm text-ink-soft">كانت</p>
          <p className="font-display text-2xl text-ink">{word}</p>
          <p className="mt-1 font-body text-xs text-ink-faint">
            بدون {forbidden.join(' · ')}
          </p>
        </div>

        <div className="relative min-h-0 flex-1 rounded-md border-bold border-ink">
          <StaticDrawing strokes={strokes} />
        </div>

        {ranked.length === 0 ? (
          <p className="text-center font-body text-sm text-ink-soft">
            ولا واحد عرفها. {artist?.name ?? 'الرسّام'} رسمها زين وايد.
          </p>
        ) : (
          <ul className="flex list-none flex-col gap-1 p-0">
            {ranked.map((playerId, index) => {
              const player = players[playerId];
              if (!player) return null;

              return (
                <li
                  key={playerId}
                  className="flex items-center gap-2 rounded-md border-thin border-ink-hairline p-1.5"
                >
                  <span dir="ltr" className="w-5 shrink-0 text-center font-display text-ink-faint">
                    {index + 1}
                  </span>
                  <PlayerAvatar
                    characterId={player.characterId}
                    name={player.name}
                    size="sm"
                    showName={false}
                    pose="celebrating"
                  />
                  <span className="min-w-0 flex-1 truncate font-body text-sm text-ink">
                    {player.name}
                  </span>
                  <span dir="ltr" className="shrink-0 font-display text-sm text-teal-deep">
                    +{delta[playerId] ?? 0}
                  </span>
                  <span dir="ltr" className="shrink-0 font-display text-base text-ink">
                    {scores[playerId] ?? 0}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Screen>
  );
}
