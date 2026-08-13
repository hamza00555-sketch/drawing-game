/**
 * Dev-only previews for كانت إيش؟, including the Final Journey Poster.
 */

import { useMemo, useRef } from 'react';
import type { DrawingCanvasHandle } from '../design/components/DrawingCanvas';
import { KanatEshTurnScreen } from '../modes/kanatEsh/screens/KanatEshTurnScreen';
import { JourneyPoster, type JourneyLink } from '../modes/kanatEsh/screens/JourneyPoster';
import { PEN_COLORS } from '../design/penColors';
import type { RoomPlayer } from '../engine/presence';
import type { Stroke } from '../engine/canvas/strokes';

const players: Record<string, RoomPlayer> = {
  p1: { id: 'p1', name: 'حمزة', characterId: 'artist', joinedAt: 1 },
  p2: { id: 'p2', name: 'نورة', characterId: 'innocent', joinedAt: 2 },
  p3: { id: 'p3', name: 'سعد', characterId: 'excited', joinedAt: 3 },
  p4: { id: 'p4', name: 'لمى', characterId: 'detective', joinedAt: 4 },
};

const noop = () => undefined;

function curve(playerId: string, color: string, seq: number, phase: number): Stroke {
  return {
    id: `s${seq}`,
    playerId,
    seq,
    tool: 'pen',
    color,
    width: 0.014,
    startedAt: seq * 100,
    points: Array.from({ length: 28 }, (_, i) => ({
      x: 0.16 + i * 0.024,
      y: 0.5 + Math.sin(i / 3 + phase) * 0.18,
      t: i * 18,
    })),
  };
}

const drawingA = [curve('p1', PEN_COLORS.artist, 0, 0)];
const drawingB = [curve('p3', PEN_COLORS.excited, 1, 1.6)];

const links: JourneyLink[] = [
  { index: 1, type: 'drawing', playerId: 'p1', strokes: drawingA },
  { index: 2, type: 'text', playerId: 'p2', text: 'دودة تحاول تطير' },
  { index: 3, type: 'drawing', playerId: 'p3', strokes: drawingB },
  { index: 4, type: 'text', playerId: 'p4', text: 'ثعبان يتعلم السباحة' },
];

export function KanatEshPreview({ phase }: { phase: string }) {
  const canvasRef = useRef<DrawingCanvasHandle | null>(null);
  const deadlines = useMemo(() => ({ turn: Date.now() + 30_000 }), []);

  switch (phase) {
    case 'ke-draw':
      return (
        <KanatEshTurnScreen
          linkType="drawing"
          previousText="دجاجة تهرب من مطعم بروست"
          isMyTurn
          currentAuthorName="حمزة"
          position={1}
          totalLinks={5}
          selfId="p1"
          strokes={drawingA}
          penColor={PEN_COLORS.artist}
          endsAt={deadlines.turn}
          durationMs={45_000}
          onSubmitText={noop}
          onSubmitDrawing={noop}
          onStrokeStart={noop}
          onStrokePoint={noop}
          onStrokeEnd={noop}
          onUndo={noop}
          canUndo
          nextSeq={() => 1}
          now={() => Date.now()}
          canvasRef={canvasRef}
        />
      );

    case 'ke-write':
      return (
        <KanatEshTurnScreen
          linkType="text"
          previousStrokes={drawingA}
          isMyTurn
          currentAuthorName="نورة"
          position={2}
          totalLinks={5}
          selfId="p2"
          strokes={[]}
          penColor={PEN_COLORS.innocent}
          endsAt={deadlines.turn}
          durationMs={35_000}
          onSubmitText={noop}
          onSubmitDrawing={noop}
          onStrokeStart={noop}
          onStrokePoint={noop}
          onStrokeEnd={noop}
          onUndo={noop}
          canUndo={false}
          nextSeq={() => 1}
          now={() => Date.now()}
          canvasRef={canvasRef}
        />
      );

    case 'ke-poster':
      return (
        <main className="wt-screen wt-paper-ground">
          <div className="mx-auto w-full max-w-content py-3">
            <JourneyPoster
              seed="دجاجة تهرب من مطعم بروست"
              links={links}
              players={players}
            />
          </div>
        </main>
      );

    default:
      return null;
  }
}

export const KANAT_ESH_PREVIEWS = ['ke-draw', 'ke-write', 'ke-poster'] as const;
