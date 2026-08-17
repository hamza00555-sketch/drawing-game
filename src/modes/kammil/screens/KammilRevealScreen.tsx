import { useCallback, useEffect, useRef, useState } from 'react';
import { GameButton } from '../../../design/components/GameButton';
import { Screen } from '../../../design/components/Screen';
import { StaticDrawing } from '../../../design/components/StaticDrawing';
import type { CanvasRenderer } from '../../../engine/canvas/renderer';
import { ReplayPlayer } from '../../../engine/canvas/replay';
import type { Stroke } from '../../../engine/canvas/strokes';
import { KAMMIL } from '../../../../shared/kammil';
import type { RoomPlayer } from '../../../engine/presence';

/**
 * كمّل رسمتي — reveal and replay.
 *
 * The replay is the point of this mode. Seeing the finished drawing tells you
 * it is a mess; watching it become one, three seconds and one player at a time,
 * is where the round is actually funny. So the replay runs automatically and
 * names each contributor as their strokes appear.
 *
 * It is deliberately short and skippable — a replay nobody can cut short stops
 * being a reward and becomes a wait.
 */

export interface KammilRevealScreenProps {
  word: string;
  guess: string;
  correct: boolean;
  guesserName: string;
  players: Record<string, RoomPlayer>;
  strokes: readonly Stroke[];
  onContinue: () => void;
  isHost: boolean;
}

export function KammilRevealScreen({
  word,
  guess,
  correct,
  guesserName,
  players,
  strokes,
  onContinue,
  isHost,
}: KammilRevealScreenProps) {
  const playerRef = useRef<ReplayPlayer | undefined>(undefined);
  const [caption, setCaption] = useState<string | undefined>(undefined);
  const [replaying, setReplaying] = useState(true);

  const handleReady = useCallback(
    (renderer: CanvasRenderer) => {
      if (strokes.length === 0) {
        setReplaying(false);
        return;
      }

      const replay = new ReplayPlayer(renderer, strokes, {
        msPerContribution: KAMMIL.replay.msPerContribution,
        holdOnNameMs: KAMMIL.replay.holdOnNameMs,
        onPlayerChange: (playerId) =>
          setCaption(playerId ? players[playerId]?.name : undefined),
        onComplete: () => {
          setReplaying(false);
          setCaption(undefined);
        },
      });

      playerRef.current = replay;
      replay.start();
    },
    [strokes, players],
  );

  useEffect(() => () => playerRef.current?.stop(), []);

  return (
    <Screen
      footer={
        replaying ? (
          <GameButton
            tone="secondary"
            size="md"
            block
            onClick={() => playerRef.current?.finish()}
          >
            تخطّي
          </GameButton>
        ) : isHost ? (
          <GameButton tone="primary" size="lg" block onClick={onContinue}>
            النتيجة
          </GameButton>
        ) : (
          <p className="text-center font-body text-sm text-ink-soft">
            في انتظار المضيف
          </p>
        )
      }
    >
      <div className="flex flex-1 flex-col gap-3 py-2">
        <div className="rounded-md border-bold border-ink bg-paper-raised p-3 text-center">
          <p className="font-display text-xl text-ink">
            {correct ? 'عرفها' : 'ما عرفها'}
          </p>
          <p className="mt-1 font-body text-sm text-ink-soft">
            {guesserName} قال <span className="font-display text-ink">{guess}</span>
          </p>
          <p className="font-body text-sm text-ink-soft">
            والكلمة كانت <span className="font-display text-ink">{word}</span>
          </p>
        </div>

        <div className="relative min-h-0 flex-1 rounded-md border-bold border-ink">
          <StaticDrawing strokes={strokes} onReady={handleReady} />

          {caption && (
            <p className="pointer-events-none absolute bottom-2 start-2 rounded-pill bg-ink px-3 py-1 font-body text-sm text-paper">
              {caption}
            </p>
          )}
        </div>
      </div>
    </Screen>
  );
}
