import { useState } from 'react';
import { DrawingCanvas, type DrawingCanvasHandle } from '../../../design/components/DrawingCanvas';
import { DrawingTools } from '../../../design/components/DrawingTools';
import { GameButton } from '../../../design/components/GameButton';
import { PlayerAvatar } from '../../../design/components/PlayerAvatar';
import { Screen } from '../../../design/components/Screen';
import { Timer } from '../../../design/components/Timer';
import type { Point, Stroke, Tool } from '../../../engine/canvas/strokes';
import type { RoomPlayer } from '../../../engine/presence';

/**
 * المزوّر — the shared canvas.
 *
 * One drawing, passed around. Everyone watches the same canvas the whole time;
 * only the active player's pen is live. Watching is deliberately not a lesser
 * state — the whole mode is judging what other people add, so spectators get
 * the full canvas, not a shrunken preview.
 *
 * The word is shown to players who know it, permanently and small. The impostor
 * simply has no word to show, because it never reached their device.
 */

export interface MozawwerDrawScreenProps {
  /** Undefined for the impostor. */
  word?: string;
  isImpostor: boolean;
  selfId: string;
  activePlayerId: string | undefined;
  players: Record<string, RoomPlayer>;
  turnOrder: readonly string[];
  strokes: readonly Stroke[];
  penColor: string;
  /** Room-tuned stroke widths. */
  penWidth?: number;
  eraserWidth?: number;
  turnEndsAt: number | null | undefined;
  turnDurationMs: number;
  /** False until enough turns have passed — see rules.canOfferReady. */
  canOfferReady: boolean;
  onEndTurn: () => void;
  onReadyToVote: () => void;
  onStrokeStart: (stroke: Omit<Stroke, 'points'>) => void;
  onStrokePoint: (strokeId: string, point: Point) => void;
  onStrokeEnd: (stroke: Stroke) => void;
  onUndo: () => void;
  canUndo: boolean;
  nextSeq: () => number;
  now: () => number;
  /**
   * React 18 types a ref created with `useRef<T | null>(null)` as
   * RefObject<T | null>, which the forwardRef prop will not accept directly.
   * Declaring it as a MutableRefObject keeps the caller's ordinary useRef
   * working without a cast at every call site.
   */
  canvasRef: React.MutableRefObject<DrawingCanvasHandle | null>;
}

export function MozawwerDrawScreen({
  word,
  isImpostor,
  selfId,
  activePlayerId,
  players,
  turnOrder,
  strokes,
  penColor,
  penWidth,
  eraserWidth,
  turnEndsAt,
  turnDurationMs,
  canOfferReady,
  onEndTurn,
  onReadyToVote,
  onStrokeStart,
  onStrokePoint,
  onStrokeEnd,
  onUndo,
  canUndo,
  nextSeq,
  now,
  canvasRef,
}: MozawwerDrawScreenProps) {
  const [tool, setTool] = useState<Tool>('pen');
  const myTurn = activePlayerId === selfId;
  const active = activePlayerId ? players[activePlayerId] : undefined;

  return (
    <Screen
      footer={
        myTurn ? (
          <GameButton tone="primary" size="lg" block onClick={onEndTurn}>
            إنهاء الدور
          </GameButton>
        ) : canOfferReady ? (
          <GameButton tone="accent" size="md" block onClick={onReadyToVote}>
            الرسمة جاهزة
          </GameButton>
        ) : (
          <p className="text-center font-body text-sm text-ink-soft">
            راقب وش يرسمون
          </p>
        )
      }
    >
      <div className="flex flex-1 flex-col gap-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-lg text-ink">
              {myTurn ? 'دورك' : `دور ${active?.name ?? '...'}`}
            </p>
            {isImpostor ? (
              <p className="font-body text-sm text-tomato-deep">أنت المزوّر</p>
            ) : (
              <p className="truncate font-body text-sm text-ink-soft">
                الكلمة: <span className="font-display text-ink">{word}</span>
              </p>
            )}
          </div>

          <Timer endsAt={turnEndsAt} durationMs={turnDurationMs} showDigits />
        </div>

        {/*
         * The turn queue. Seeing who is next matters more than it looks: it is
         * how a player knows to start planning what to add, and how the room
         * notices someone stalling.
         */}
        <ul className="flex list-none gap-2 overflow-x-auto p-0">
          {turnOrder.map((playerId) => {
            const player = players[playerId];
            if (!player) return null;

            return (
              <li key={playerId} className="shrink-0">
                <PlayerAvatar
                  characterId={player.characterId}
                  name={player.name}
                  size="sm"
                  status={playerId === activePlayerId ? 'active' : 'idle'}
                />
              </li>
            );
          })}
        </ul>

        <div className="relative min-h-0 flex-1 rounded-md border-bold border-ink">
          <DrawingCanvas
            ref={canvasRef}
            enabled={myTurn}
            tool={tool}
            color={penColor}
            width={penWidth ?? 0.012}
            {...(eraserWidth === undefined ? {} : { eraserWidth })}
            playerId={selfId}
            strokes={strokes}
            nextSeq={nextSeq}
            now={now}
            onStrokeStart={onStrokeStart}
            onStrokePoint={onStrokePoint}
            onStrokeEnd={onStrokeEnd}
          />
        </div>

        {myTurn && (
          <DrawingTools
            tool={tool}
            onToolChange={setTool}
            onUndo={onUndo}
            canUndo={canUndo}
          />
        )}
      </div>
    </Screen>
  );
}
