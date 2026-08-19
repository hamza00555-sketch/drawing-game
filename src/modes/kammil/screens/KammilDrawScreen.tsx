import { CountdownOverlay } from '../../../design/components/CountdownOverlay';
import { DrawingCanvas, type DrawingCanvasHandle } from '../../../design/components/DrawingCanvas';
import { PlayerAvatar } from '../../../design/components/PlayerAvatar';
import { Screen } from '../../../design/components/Screen';
import { Timer } from '../../../design/components/Timer';
import type { Point, Stroke } from '../../../engine/canvas/strokes';
import type { RoomPlayer } from '../../../engine/presence';

/**
 * كمّل رسمتي — the turn.
 *
 * There is no finish button, on purpose. The turn ends when the timer does, so
 * every artist is under identical pressure and nobody can bank extra seconds by
 * being decisive. During `countdown` the canvas is visible but inert — the
 * artist reads the drawing and the word with the pen locked.
 *
 * The guesser sees this screen too, but never the word: they watch a drawing
 * they will have to explain, which is most of the comedy.
 */

export interface KammilDrawScreenProps {
  /** Undefined for the guesser, throughout. */
  word?: string;
  isGuesser: boolean;
  counting: boolean;
  /** Duo only: this is the bonus window after a wrong first guess. */
  extending?: boolean;
  selfId: string;
  currentArtistId: string | undefined;
  players: Record<string, RoomPlayer>;
  artistIds: readonly string[];
  strokes: readonly Stroke[];
  penColor: string;
  /** End of the countdown, or of the turn — whichever phase is live. */
  phaseEndsAt: number | null | undefined;
  turnDurationMs: number;
  countdownDurationMs: number;
  onCountdownComplete: () => void;
  onTurnExpire: () => void;
  onStrokeStart: (stroke: Omit<Stroke, 'points'>) => void;
  onStrokePoint: (strokeId: string, point: Point) => void;
  onStrokeEnd: (stroke: Stroke) => void;
  nextSeq: () => number;
  now: () => number;
  canvasRef: React.MutableRefObject<DrawingCanvasHandle | null>;
}

export function KammilDrawScreen({
  word,
  isGuesser,
  counting,
  extending = false,
  selfId,
  currentArtistId,
  players,
  artistIds,
  strokes,
  penColor,
  phaseEndsAt,
  turnDurationMs,
  countdownDurationMs,
  onCountdownComplete,
  onTurnExpire,
  onStrokeStart,
  onStrokePoint,
  onStrokeEnd,
  nextSeq,
  now,
  canvasRef,
}: KammilDrawScreenProps) {
  const myTurn = currentArtistId === selfId;
  const artist = currentArtistId ? players[currentArtistId] : undefined;
  const penLive = myTurn && !counting;
  const position = currentArtistId ? artistIds.indexOf(currentArtistId) + 1 : 0;

  return (
    <Screen
      footer={
        <p className="text-center font-body text-sm text-ink-soft">
          {myTurn
            ? counting
              ? 'استعد...'
              : extending
                ? 'فرصة أخيرة — كمّلها!'
                : 'ارسم بسرعة'
            : extending
              ? `${artist?.name ?? '...'} يكمّل الرسمة`
              : `دور ${artist?.name ?? '...'}`}
        </p>
      }
    >
      <div className="flex flex-1 flex-col gap-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-lg text-ink">
              {myTurn ? 'دورك' : 'راقب'}
            </p>
            {isGuesser ? (
              <p className="font-body text-sm text-ink-soft">أنت اللي بتخمّن</p>
            ) : (
              <p className="truncate font-body text-sm text-ink-soft">
                الكلمة: <span className="font-display text-ink">{word}</span>
              </p>
            )}
          </div>

          <span className="shrink-0 font-body text-sm text-ink-faint">
            {position} من {artistIds.length}
          </span>
        </div>

        {/*
         * Digits are hidden during the turn itself: at two or three seconds a
         * changing number is a distraction, while a draining bar reads at a
         * glance without pulling the eye off the canvas.
         */}
        <Timer
          endsAt={phaseEndsAt}
          durationMs={counting ? countdownDurationMs : turnDurationMs}
          showDigits={false}
          {...(myTurn && !counting ? { onExpire: onTurnExpire } : {})}
        />

        <div className="relative min-h-0 flex-1 rounded-md border-bold border-ink">
          <DrawingCanvas
            ref={canvasRef}
            enabled={penLive}
            // Pen only. There is no eraser or undo in this mode: with a
            // three-second turn, an undo button is a trap that costs a player
            // their entire contribution.
            tool="pen"
            color={penColor}
            width={0.014}
            playerId={selfId}
            strokes={strokes}
            nextSeq={nextSeq}
            now={now}
            onStrokeStart={onStrokeStart}
            onStrokePoint={onStrokePoint}
            onStrokeEnd={onStrokeEnd}
          />

          {counting && myTurn && (
            <CountdownOverlay endsAt={phaseEndsAt} onComplete={onCountdownComplete} />
          )}
        </div>

        <ul className="flex list-none gap-2 overflow-x-auto p-0">
          {artistIds.map((artistId) => {
            const player = players[artistId];
            if (!player) return null;

            return (
              <li key={artistId} className="shrink-0">
                <PlayerAvatar
                  characterId={player.characterId}
                  name={player.name}
                  size="sm"
                  status={artistId === currentArtistId ? 'active' : 'idle'}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </Screen>
  );
}
