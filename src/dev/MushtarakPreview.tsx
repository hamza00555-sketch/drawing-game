/**
 * Dev-only previews for الرسم المشترك.
 */

import { useMemo, useRef } from 'react';
import type { DrawingCanvasHandle } from '../design/components/DrawingCanvas';
import { MushtarakDrawScreen } from '../modes/mushtarak/screens/MushtarakDrawScreen';
import { MushtarakRevealScreen } from '../modes/mushtarak/screens/MushtarakRevealScreen';
import { PEN_COLORS } from '../design/penColors';
import type { RoomPlayer } from '../engine/presence';
import type { Stroke } from '../engine/canvas/strokes';

const players: Record<string, RoomPlayer> = {
  a1: { id: 'a1', name: 'حمزة', characterId: 'artist', joinedAt: 1 },
  a2: { id: 'a2', name: 'نورة', characterId: 'innocent', joinedAt: 2 },
  g1: { id: 'g1', name: 'سعد', characterId: 'excited', joinedAt: 3 },
};

const artistIds = ['a1', 'a2'];
const penColors = { a1: PEN_COLORS.artist, a2: PEN_COLORS.innocent };
const noop = () => undefined;

/** Two authors, two colours — what the mode is about. */
const strokes: Stroke[] = [
  {
    id: 's1',
    playerId: 'a1',
    seq: 0,
    tool: 'pen',
    color: PEN_COLORS.artist,
    width: 0.012,
    startedAt: 0,
    points: Array.from({ length: 36 }, (_, i) => {
      const t = (i / 36) * Math.PI * 2;
      return { x: 0.38 + Math.cos(t) * 0.2, y: 0.42 + Math.sin(t) * 0.16, t: i * 16 };
    }),
  },
  {
    id: 's2',
    playerId: 'a2',
    seq: 1,
    tool: 'pen',
    color: PEN_COLORS.innocent,
    width: 0.012,
    startedAt: 500,
    points: Array.from({ length: 30 }, (_, i) => ({
      x: 0.3 + i * 0.014,
      y: 0.68 + Math.sin(i / 3) * 0.07,
      t: i * 18,
    })),
  },
];

export function MushtarakPreview({ phase }: { phase: string }) {
  const canvasRef = useRef<DrawingCanvasHandle | null>(null);
  const deadlines = useMemo(() => ({ draw: Date.now() + 45_000 }), []);

  switch (phase) {
    case 'ms-draw':
      return (
        <MushtarakDrawScreen
          myPart="ديناصور"
          isArtist
          selfId="a1"
          players={players}
          artistIds={artistIds}
          penColors={penColors}
          strokes={strokes}
          endsAt={deadlines.draw}
          durationMs={60_000}
          gotYouUsedBy={['a2']}
          gotYouFrom="a2"
          canSendGotYou
          onSendGotYou={noop}
          onStrokeStart={noop}
          onStrokePoint={noop}
          onStrokeEnd={noop}
          onUndo={noop}
          canUndo
          nextSeq={() => 2}
          now={() => Date.now()}
          canvasRef={canvasRef}
        />
      );

    case 'ms-reveal':
      return (
        <MushtarakRevealScreen
          partA="ديناصور"
          partB="يلبس فستان عرس"
          full="ديناصور يلبس فستان عرس"
          artistIds={artistIds}
          penColors={penColors}
          players={players}
          strokes={strokes}
          correctGuesserIds={['g1']}
          isHost
          onContinue={noop}
        />
      );

    default:
      return null;
  }
}

export const MUSHTARAK_PREVIEWS = ['ms-draw', 'ms-reveal'] as const;
