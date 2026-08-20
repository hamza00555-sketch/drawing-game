import { useState, type FormEvent } from 'react';
import { DrawingCanvas, type DrawingCanvasHandle } from '../../../design/components/DrawingCanvas';
import { DrawingTools } from '../../../design/components/DrawingTools';
import { GameButton } from '../../../design/components/GameButton';
import { Screen } from '../../../design/components/Screen';
import { TextField } from '../../../design/components/TextField';
import { Timer } from '../../../design/components/Timer';
import type { Point, Stroke, Tool } from '../../../engine/canvas/strokes';
import type { RoomPlayer } from '../../../engine/presence';

/**
 * الممنوعات — drawing and guessing, at the same time.
 *
 * The simultaneity is the mode. The artist watches wrong guesses arrive and has
 * to steer the room without using the one feature that would settle it, so the
 * guess feed is given real space on the artist's screen rather than being
 * tucked away.
 *
 * Guessers see the letter hint and nothing else. Guessing is unlimited while
 * the clock runs, and a guesser who has already got it switches to watching —
 * their rank is locked, so continuing to type would only spoil it for others.
 */

export interface MamnouDrawScreenProps {
  isArtist: boolean;
  /** Only ever passed to the artist. */
  word?: string;
  forbidden?: readonly string[];
  /**
   * The letter-count hint, e.g. "_ _ _". Computed SERVER-side and sent to
   * guessers, because they never receive the word — deriving it on the client
   * would require shipping them the answer.
   */
  hint: string;
  selfId: string;
  players: Record<string, RoomPlayer>;
  strokes: readonly Stroke[];
  penColor: string;
  /** Room-tuned stroke widths. */
  penWidth?: number;
  eraserWidth?: number;
  endsAt: number | null | undefined;
  durationMs: number;
  /** Recent guesses, newest first. Correctness is decided server-side. */
  guesses: readonly { id: string; playerId: string; text: string; correct?: boolean }[];
  /** Whether this player has already guessed correctly. */
  alreadyCorrect: boolean;
  onGuess: (text: string) => void;
  onStrokeStart: (stroke: Omit<Stroke, 'points'>) => void;
  onStrokePoint: (strokeId: string, point: Point) => void;
  onStrokeEnd: (stroke: Stroke) => void;
  onUndo: () => void;
  canUndo: boolean;
  nextSeq: () => number;
  now: () => number;
  canvasRef: React.MutableRefObject<DrawingCanvasHandle | null>;
}

export function MamnouDrawScreen({
  isArtist,
  word,
  forbidden = [],
  hint,
  selfId,
  players,
  strokes,
  penColor,
  penWidth,
  eraserWidth,
  endsAt,
  durationMs,
  guesses,
  alreadyCorrect,
  onGuess,
  onStrokeStart,
  onStrokePoint,
  onStrokeEnd,
  onUndo,
  canUndo,
  nextSeq,
  now,
  canvasRef,
}: MamnouDrawScreenProps) {
  const [tool, setTool] = useState<Tool>('pen');
  const [draft, setDraft] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    if (draft.trim().length === 0 || alreadyCorrect) return;
    onGuess(draft);
    setDraft('');
  }

  return (
    <form onSubmit={submit} className="contents">
      <Screen
        footer={
          isArtist ? (
            <DrawingTools
              tool={tool}
              onToolChange={setTool}
              onUndo={onUndo}
              canUndo={canUndo}
            />
          ) : alreadyCorrect ? (
            <p className="text-center font-body text-sm text-teal-deep">
              عرفتها. خل الباقين يفكرون.
            </p>
          ) : (
            <GameButton
              tone="primary"
              size="md"
              block
              type="submit"
              disabled={draft.trim().length === 0}
            >
              خمّن
            </GameButton>
          )
        }
      >
        <div className="flex flex-1 flex-col gap-3 py-2">
          {/*
           * For a guesser the hint is the ONLY information they have, so it
           * gets its own line at display size rather than being a mark in the
           * corner. The artist's word takes the same slot.
           */}
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="shrink-0 font-body text-sm text-ink-soft">
                {isArtist ? 'ارسم' : 'الكلمة'}
              </p>
              <Timer endsAt={endsAt} durationMs={durationMs} className="max-w-[8rem]" />
            </div>

            {isArtist ? (
              <p className="truncate font-display text-2xl text-ink">{word}</p>
            ) : (
              <p
                dir="ltr"
                className="text-center font-display text-2xl tracking-[0.3em] text-ink"
              >
                {hint}
              </p>
            )}
          </div>

          {isArtist && forbidden.length > 0 && (
            <ul className="flex list-none flex-wrap gap-2 p-0">
              {forbidden.map((item) => (
                <li
                  key={item}
                  className="rounded-pill border-thin border-tomato px-3 py-1 font-body text-xs text-tomato-deep"
                >
                  {item}
                </li>
              ))}
            </ul>
          )}

          <div className="relative min-h-0 flex-1 rounded-md border-bold border-ink">
            <DrawingCanvas
              ref={canvasRef}
              enabled={isArtist}
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

          {!isArtist && !alreadyCorrect && (
            <TextField
              label="تخمينك"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={40}
              placeholder="اكتب وخمّن كم ما تبي"
            />
          )}

          {/*
           * The guess feed. Correct guesses are marked but the WORD is never
           * echoed to players who have not got it — printing it would hand the
           * answer to everyone still thinking.
           */}
          <ul className="flex max-h-24 list-none flex-col gap-1 overflow-y-auto p-0">
            {guesses.slice(0, 8).map((entry) => {
              const player = players[entry.playerId];
              const mine = entry.playerId === selfId;
              const hide = entry.correct && !isArtist && !mine && !alreadyCorrect;

              return (
                <li
                  key={entry.id}
                  className={`flex items-baseline gap-2 font-body text-sm ${
                    entry.correct ? 'text-teal-deep' : 'text-ink-soft'
                  }`}
                >
                  <span className="shrink-0 text-ink-faint">{player?.name ?? '...'}</span>
                  <span className="min-w-0 truncate">
                    {hide ? 'عرفها' : entry.text}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </Screen>
    </form>
  );
}
