/**
 * Dev-only drawing harness.
 *
 * Runs the real canvas, renderer, buffer, undo and replay with the network
 * switched off, so the pen can be exercised without standing up a room. This is
 * how the drawing path gets verified: a canvas engine that only ever passes
 * unit tests has not been tested.
 */

import { useRef, useState } from 'react';
import { DrawingCanvas, type DrawingCanvasHandle } from '../design/components/DrawingCanvas';
import { DrawingTools } from '../design/components/DrawingTools';
import { GameButton } from '../design/components/GameButton';
import { ReplayPlayer } from '../engine/canvas/replay';
import { sortStrokes, type Point, type Stroke, type Tool } from '../engine/canvas/strokes';
import { CHARACTERS } from '../content/characters';

const PALETTE = CHARACTERS.slice(0, 5).map((c) => c.penColor);

export function DrawingPreview() {
  const canvasRef = useRef<DrawingCanvasHandle | null>(null);
  const seqRef = useRef(0);
  const replayRef = useRef<ReplayPlayer | undefined>(undefined);

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState<string>(PALETTE[0] ?? 'var(--wt-pen-artist)');
  const [replaying, setReplaying] = useState(false);
  const [caption, setCaption] = useState<string | undefined>(undefined);

  // Two fake authors so replay grouping and per-player colours are exercised.
  const [playerId, setPlayerId] = useState('p1');

  const mine = strokes.filter((s) => s.playerId === playerId);

  function undo() {
    const own = strokes.filter((s) => s.playerId === playerId);
    const last = own[own.length - 1];
    if (!last) return;

    const next = strokes.filter((s) => s.id !== last.id);
    setStrokes(next);
    canvasRef.current?.rebuild(next);
  }

  function startReplay() {
    const renderer = canvasRef.current?.renderer();
    if (!renderer || strokes.length === 0) return;

    replayRef.current?.stop();
    setReplaying(true);

    const player = new ReplayPlayer(renderer, strokes, {
      msPerContribution: 900,
      holdOnNameMs: 300,
      onPlayerChange: (id) => setCaption(id),
      onComplete: () => {
        setReplaying(false);
        setCaption(undefined);
      },
    });

    replayRef.current = player;
    player.start();
  }

  function clearAll() {
    replayRef.current?.stop();
    setReplaying(false);
    setStrokes([]);
    seqRef.current = 0;
    canvasRef.current?.clear();
  }

  return (
    <main className="wt-screen wt-paper-ground">
      <div className="mx-auto flex w-full max-w-content flex-1 flex-col gap-3 py-3">
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-lg text-ink">تجربة الرسم</h1>
          <span className="font-body text-xs text-ink-faint">
            {strokes.length} خط · {mine.length} لك
          </span>
        </div>

        <div className="relative min-h-0 flex-1 rounded-md border-bold border-ink">
          <DrawingCanvas
            ref={canvasRef}
            enabled={!replaying}
            tool={tool}
            color={color}
            width={0.012}
            playerId={playerId}
            strokes={strokes}
            nextSeq={() => {
              const seq = seqRef.current;
              seqRef.current += 1;
              return seq;
            }}
            now={() => performance.now()}
            onStrokeEnd={(stroke: Stroke) =>
              setStrokes((current) => sortStrokes([...current, stroke]))
            }
            onStrokePoint={(_id: string, _point: Point) => undefined}
          />

          {caption && (
            <p className="pointer-events-none absolute bottom-2 start-2 rounded-pill bg-ink px-3 py-1 font-body text-sm text-paper">
              {caption}
            </p>
          )}
        </div>

        <DrawingTools
          tool={tool}
          onToolChange={setTool}
          onUndo={undo}
          canUndo={mine.length > 0}
          disabled={replaying}
          colors={PALETTE}
          color={color}
          onColorChange={setColor}
        />

        <div className="flex gap-2">
          <GameButton
            tone="secondary"
            size="sm"
            onClick={() => setPlayerId((id) => (id === 'p1' ? 'p2' : 'p1'))}
          >
            الراسم: {playerId}
          </GameButton>
          <GameButton tone="accent" size="sm" onClick={startReplay} disabled={replaying}>
            إعادة
          </GameButton>
          <GameButton tone="secondary" size="sm" onClick={clearAll}>
            مسح
          </GameButton>
        </div>
      </div>
    </main>
  );
}
