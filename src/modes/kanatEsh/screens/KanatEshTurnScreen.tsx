import { useState, type FormEvent } from 'react';
import { DrawingCanvas, type DrawingCanvasHandle } from '../../../design/components/DrawingCanvas';
import { DrawingTools } from '../../../design/components/DrawingTools';
import { GameButton } from '../../../design/components/GameButton';
import { Screen } from '../../../design/components/Screen';
import { StaticDrawing } from '../../../design/components/StaticDrawing';
import { TextField } from '../../../design/components/TextField';
import { Timer } from '../../../design/components/Timer';
import type { Point, Stroke, Tool } from '../../../engine/canvas/strokes';

/**
 * كانت إيش؟ — one link of the chain.
 *
 * A player is shown exactly ONE thing — the link before theirs — and produces
 * the next. Either they read a sentence and draw it, or they look at a drawing
 * and write what they think it is.
 *
 * The screen deliberately offers no way to see anything else. There is no chain
 * history, no seed sentence, no peek. That absence is the mode: a player who
 * can see two links can reason backwards, and the drift stops being real.
 */

export interface KanatEshTurnScreenProps {
  /** 'drawing' means: read the sentence and draw it. */
  linkType: 'text' | 'drawing';
  /** The single previous link. Exactly one of these is set. */
  previousText?: string;
  previousStrokes?: readonly Stroke[];
  isMyTurn: boolean;
  currentAuthorName: string;
  position: number;
  totalLinks: number;
  selfId: string;
  strokes: readonly Stroke[];
  penColor: string;
  endsAt: number | null | undefined;
  durationMs: number;
  onSubmitText: (text: string) => void;
  onSubmitDrawing: () => void;
  onStrokeStart: (stroke: Omit<Stroke, 'points'>) => void;
  onStrokePoint: (strokeId: string, point: Point) => void;
  onStrokeEnd: (stroke: Stroke) => void;
  onUndo: () => void;
  canUndo: boolean;
  nextSeq: () => number;
  now: () => number;
  canvasRef: React.MutableRefObject<DrawingCanvasHandle | null>;
}

export function KanatEshTurnScreen({
  linkType,
  previousText,
  previousStrokes,
  isMyTurn,
  currentAuthorName,
  position,
  totalLinks,
  selfId,
  strokes,
  penColor,
  endsAt,
  durationMs,
  onSubmitText,
  onSubmitDrawing,
  onStrokeStart,
  onStrokePoint,
  onStrokeEnd,
  onUndo,
  canUndo,
  nextSeq,
  now,
  canvasRef,
}: KanatEshTurnScreenProps) {
  const [tool, setTool] = useState<Tool>('pen');
  const [draft, setDraft] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    if (draft.trim().length === 0) return;
    onSubmitText(draft);
  }

  if (!isMyTurn) {
    return (
      <Screen>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <h1 className="font-display text-2xl text-ink">دور {currentAuthorName}</h1>
          <p className="font-body text-base text-ink-soft">
            ما راح تشوف شي إلا في النهاية
          </p>
          <p className="font-body text-sm text-ink-faint">
            {position} من {totalLinks}
          </p>
          <Timer endsAt={endsAt} durationMs={durationMs} className="w-full max-w-[16rem]" />
        </div>
      </Screen>
    );
  }

  // Draw what you read.
  if (linkType === 'drawing') {
    return (
      <Screen
        footer={
          <>
            <DrawingTools
              tool={tool}
              onToolChange={setTool}
              onUndo={onUndo}
              canUndo={canUndo}
            />
            <GameButton tone="primary" size="lg" block onClick={onSubmitDrawing}>
              خلصت
            </GameButton>
          </>
        }
      >
        <div className="flex flex-1 flex-col gap-3 py-2">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-body text-sm text-ink-soft">ارسم هذي</p>
            <Timer endsAt={endsAt} durationMs={durationMs} className="max-w-[8rem]" />
          </div>

          <div className="rounded-md border-bold border-ink bg-paper-raised p-3">
            <p className="font-display text-lg text-ink">{previousText}</p>
          </div>

          <div className="relative min-h-0 flex-1 rounded-md border-bold border-ink">
            <DrawingCanvas
              ref={canvasRef}
              enabled
              tool={tool}
              color={penColor}
              width={0.012}
              playerId={selfId}
              strokes={strokes}
              nextSeq={nextSeq}
              now={now}
              onStrokeStart={onStrokeStart}
              onStrokePoint={onStrokePoint}
              onStrokeEnd={onStrokeEnd}
            />
          </div>
        </div>
      </Screen>
    );
  }

  // Write what you see.
  return (
    <form onSubmit={submit} className="contents">
      <Screen
        footer={
          <GameButton
            tone="primary"
            size="lg"
            block
            type="submit"
            disabled={draft.trim().length === 0}
          >
            هذا اللي أشوفه
          </GameButton>
        }
      >
        <div className="flex flex-1 flex-col gap-3 py-2">
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="font-display text-2xl text-ink">وش ذا؟</h1>
            <Timer endsAt={endsAt} durationMs={durationMs} className="max-w-[8rem]" />
          </div>

          <div className="relative min-h-0 flex-1 rounded-md border-bold border-ink">
            <StaticDrawing strokes={previousStrokes ?? []} />
          </div>

          <TextField
            label="اكتب وش تشوف"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={80}
            placeholder="جملة وحدة تكفي"
          />
        </div>
      </Screen>
    </form>
  );
}
