import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DrawingCanvas, type DrawingCanvasHandle } from '../../../design/components/DrawingCanvas';
import { DrawingTools } from '../../../design/components/DrawingTools';
import { GameButton } from '../../../design/components/GameButton';
import { Screen } from '../../../design/components/Screen';
import { Timer } from '../../../design/components/Timer';
import type { Point, Stroke, Tool } from '../../../engine/canvas/strokes';
import type { RoomPlayer } from '../../../engine/presence';

/**
 * الرسم المشترك — two pens, one canvas.
 *
 * The only mode where two players draw simultaneously, so the pen colours are
 * doing real work: they are the only way anyone can tell afterwards who drew
 * what, and the only way each artist can see the other's idea taking shape
 * while they draw their own.
 *
 * A partner legend sits above the canvas showing both colours. Without it the
 * second colour just reads as "someone else is here" instead of "that is Noura,
 * and she is drawing something completely different from me".
 */

export interface MushtarakDrawScreenProps {
  /** This player's half of the prompt. Undefined for guessers. In Duo, both
   * artists get the whole prompt here — there is no split to protect. */
  myPart?: string;
  isArtist: boolean;
  /** Duo ruleset: alternating short turns instead of simultaneous drawing. */
  isDuo?: boolean;
  /** Duo only: is it this player's turn right now? */
  isMyTurn?: boolean;
  turnIndex?: number;
  totalSwaps?: number;
  selfId: string;
  players: Record<string, RoomPlayer>;
  artistIds: readonly string[];
  /** Pen colour per artist id. */
  penColors: Record<string, string>;
  strokes: readonly Stroke[];
  endsAt: number | null | undefined;
  durationMs: number;
  /** Artists who have spent their «فهمتك». */
  gotYouUsedBy: readonly string[];
  /** Most recent «فهمتك» sender, shown briefly. */
  gotYouFrom?: string | undefined;
  canSendGotYou: boolean;
  onSendGotYou: () => void;
  onStrokeStart: (stroke: Omit<Stroke, 'points'>) => void;
  onStrokePoint: (strokeId: string, point: Point) => void;
  onStrokeEnd: (stroke: Stroke) => void;
  onUndo: () => void;
  canUndo: boolean;
  nextSeq: () => number;
  now: () => number;
  canvasRef: React.MutableRefObject<DrawingCanvasHandle | null>;
}

export function MushtarakDrawScreen({
  myPart,
  isArtist,
  isDuo = false,
  isMyTurn = false,
  turnIndex = 0,
  totalSwaps = 0,
  selfId,
  players,
  artistIds,
  penColors,
  strokes,
  endsAt,
  durationMs,
  gotYouUsedBy,
  gotYouFrom,
  canSendGotYou,
  onSendGotYou,
  onStrokeStart,
  onStrokePoint,
  onStrokeEnd,
  onUndo,
  canUndo,
  nextSeq,
  now,
  canvasRef,
}: MushtarakDrawScreenProps) {
  const [tool, setTool] = useState<Tool>('pen');
  const partner = artistIds.find((id) => id !== selfId);
  const partnerName = partner ? players[partner]?.name : undefined;
  const canDrawNow = isDuo ? isMyTurn : isArtist;

  return (
    <Screen
      footer={
        isDuo ? (
          <>
            <DrawingTools
              tool={tool}
              onToolChange={setTool}
              onUndo={onUndo}
              canUndo={canUndo}
              disabled={!isMyTurn}
              hideEraser
            />
            <p className="text-center font-body text-sm text-ink-soft">
              {isMyTurn ? 'دورك الآن!' : `دور ${partnerName ?? 'شريكك'}`}
            </p>
          </>
        ) : isArtist ? (
          <>
            <DrawingTools
              tool={tool}
              onToolChange={setTool}
              onUndo={onUndo}
              canUndo={canUndo}
            />
            {/*
             * «فهمتك» is the artists' ONLY channel, and it is limited to one
             * use so it stays a signal rather than becoming a chat — which
             * would dissolve the misunderstanding the mode runs on.
             */}
            <GameButton
              tone="accent"
              size="md"
              block
              disabled={!canSendGotYou}
              onClick={onSendGotYou}
            >
              {canSendGotYou ? 'فهمتك' : 'استخدمتها'}
            </GameButton>
          </>
        ) : (
          <p className="text-center font-body text-sm text-ink-soft">
            خلّهم يخلصون، وبعدين خمّن
          </p>
        )
      }
    >
      <div className="flex flex-1 flex-col gap-3 py-2">
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <p className="font-body text-sm text-ink-soft">
              {isDuo
                ? `تبديلة ${turnIndex + 1} من ${totalSwaps}`
                : isArtist
                  ? 'نصيبك من الفكرة'
                  : 'اثنين يرسمون'}
            </p>
            {(isDuo || isArtist) && (
              <p className="truncate font-display text-xl text-ink">{myPart}</p>
            )}
          </div>
          <Timer endsAt={endsAt} durationMs={durationMs} className="max-w-[8rem]" />
        </div>

        {/*
         * Colour legend. The pen colours are the only record of who drew what,
         * so naming them is what turns a second colour from noise into
         * information.
         */}
        <ul className="flex list-none gap-3 p-0">
          {artistIds.map((artistId) => {
            const player = players[artistId];
            if (!player) return null;

            return (
              <li key={artistId} className="flex min-w-0 items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-pill border-thin border-ink"
                  style={{ backgroundColor: penColors[artistId] }}
                  aria-hidden
                />
                <span className="truncate font-body text-sm text-ink-soft">
                  {artistId === selfId ? 'أنت' : player.name}
                </span>
                {gotYouUsedBy.includes(artistId) && (
                  <span className="shrink-0 font-body text-xs text-ink-faint">فهمك</span>
                )}
              </li>
            );
          })}
        </ul>

        <div className="relative min-h-0 flex-1 rounded-md border-bold border-ink">
          <DrawingCanvas
            ref={canvasRef}
            enabled={canDrawNow}
            tool={tool}
            color={penColors[selfId] ?? '#2a211c'}
            width={0.012}
            playerId={selfId}
            strokes={strokes}
            nextSeq={nextSeq}
            now={now}
            onStrokeStart={onStrokeStart}
            onStrokePoint={onStrokePoint}
            onStrokeEnd={onStrokeEnd}
          />

          <AnimatePresence>
            {gotYouFrom && (
              <motion.p
                key={gotYouFrom}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute bottom-2 start-2 rounded-pill bg-ink px-3 py-1 font-body text-sm text-paper"
              >
                {players[gotYouFrom]?.name ?? partnerName} فهمك
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Screen>
  );
}
