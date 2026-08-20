import { useCallback, useEffect, useRef, useState } from 'react';
import { GameButton } from '../../../design/components/GameButton';
import { Screen } from '../../../design/components/Screen';
import { StaticDrawing } from '../../../design/components/StaticDrawing';
import type { CanvasRenderer } from '../../../engine/canvas/renderer';
import { ReplayPlayer } from '../../../engine/canvas/replay';
import type { Stroke } from '../../../engine/canvas/strokes';
import { MUSHTARAK } from '../../../../shared/mushtarak';
import type { RoomPlayer } from '../../../engine/presence';

/**
 * الرسم المشترك — reveal.
 *
 * The replay matters here for a different reason than in كمّل رسمتي: there the
 * joke is how the drawing degraded, here it is watching two people build
 * incompatible things on the same sheet without either realising. Grouping the
 * replay by author separates the two intentions that were tangled together.
 *
 * The two halves are shown side by side, because the gap between them IS the
 * punchline — seeing only the finished phrase loses it.
 */

export interface MushtarakRevealScreenProps {
  partA: string;
  partB: string;
  full: string;
  artistIds: readonly string[];
  penColors: Record<string, string>;
  players: Record<string, RoomPlayer>;
  strokes: readonly Stroke[];
  correctGuesserIds: readonly string[];
  /** Duo ruleset: no guessing happened, so the two-half comparison and the
   * "who got it" caption below don't apply — both are skipped. */
  isDuo?: boolean;
  isHost: boolean;
  onContinue: () => void;
}

export function MushtarakRevealScreen({
  partA,
  partB,
  full,
  artistIds,
  penColors,
  players,
  strokes,
  correctGuesserIds,
  isDuo = false,
  isHost,
  onContinue,
}: MushtarakRevealScreenProps) {
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
        msPerContribution: isDuo
          ? MUSHTARAK.duo.replay.msPerContribution
          : MUSHTARAK.replay.msPerContribution,
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
    [strokes, players, isDuo],
  );

  useEffect(() => () => playerRef.current?.stop(), []);

  return (
    <Screen
      footer={
        replaying ? (
          <GameButton tone="secondary" size="md" block onClick={() => playerRef.current?.finish()}>
            تخطّي
          </GameButton>
        ) : isHost ? (
          <GameButton tone="primary" size="lg" block onClick={onContinue}>
            النتيجة
          </GameButton>
        ) : (
          <p className="text-center font-body text-sm text-ink-soft">في انتظار المضيف</p>
        )
      }
    >
      <div className="flex flex-1 flex-col gap-3 py-2">
        <div className="rounded-md border-bold border-ink bg-paper-raised p-3 text-center">
          <p className="font-display text-xl text-ink">{full}</p>
          <p className="mt-1 font-body text-xs text-ink-soft">
            {isDuo
              ? correctGuesserIds.length === 2
                ? 'كلٍ عرف نص الثاني'
                : correctGuesserIds.length === 1
                  ? 'واحد بس عرف نص صاحبه'
                  : 'ولا واحد عرف نص الثاني'
              : correctGuesserIds.length > 0
                ? `${correctGuesserIds.length} عرفوها`
                : 'ولا واحد عرفها'}
          </p>
        </div>

        {/*
         * The two halves side by side — the gap between them is the joke, and
         * in Duo it is also the answer key: each player was guessing the half
         * in the OTHER column, so a tick per side says who read whose drawing.
         */}
        <ul className="grid list-none grid-cols-2 gap-2 p-0">
          {[partA, partB].map((part, index) => {
            const artistId = artistIds[index];
            const player = artistId ? players[artistId] : undefined;
            const gotIt = artistId ? correctGuesserIds.includes(artistId) : false;

            return (
              <li
                key={part}
                className="rounded-md border-thin border-ink-hairline bg-paper p-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-pill border-thin border-ink"
                    style={{ backgroundColor: artistId ? penColors[artistId] : undefined }}
                    aria-hidden
                  />
                  <span className="truncate font-body text-xs text-ink-faint">
                    {player?.name ?? ''}
                  </span>
                  {isDuo && (
                    <span
                      className={[
                        'ms-auto shrink-0 font-body text-xs',
                        gotIt ? 'text-ink-soft' : 'text-tomato-deep',
                      ].join(' ')}
                    >
                      {gotIt ? 'عرف نص صاحبه' : 'ما عرف'}
                    </span>
                  )}
                </div>
                <p className="mt-1 font-display text-base text-ink">{part}</p>
              </li>
            );
          })}
        </ul>

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
