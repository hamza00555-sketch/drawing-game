/**
 * Dev-only previews for الممنوعات.
 */

import { useMemo, useRef } from 'react';
import type { DrawingCanvasHandle } from '../design/components/DrawingCanvas';
import { MamnouBriefScreen } from '../modes/mamnou3at/screens/MamnouBriefScreen';
import { MamnouDrawScreen } from '../modes/mamnou3at/screens/MamnouDrawScreen';
import { MamnouResultScreen } from '../modes/mamnou3at/screens/MamnouResultScreen';
import { letterHint } from '../modes/mamnou3at/rules';
import { PEN_COLORS } from '../design/penColors';
import type { RoomPlayer } from '../engine/presence';
import type { Stroke } from '../engine/canvas/strokes';

const players: Record<string, RoomPlayer> = {
  a1: { id: 'a1', name: 'حمزة', characterId: 'artist', joinedAt: 1 },
  g1: { id: 'g1', name: 'نورة', characterId: 'innocent', joinedAt: 2 },
  g2: { id: 'g2', name: 'سعد', characterId: 'excited', joinedAt: 3 },
  g3: { id: 'g3', name: 'لمى', characterId: 'detective', joinedAt: 4 },
};

const FORBIDDEN = ['الشوارب', 'الذيل', 'الأذن المثلثة'];
const noop = () => undefined;

const strokes: Stroke[] = [
  {
    id: 's1',
    playerId: 'a1',
    seq: 0,
    tool: 'pen',
    color: PEN_COLORS.artist,
    width: 0.012,
    startedAt: 0,
    points: Array.from({ length: 40 }, (_, i) => {
      const t = (i / 40) * Math.PI * 2;
      return { x: 0.5 + Math.cos(t) * 0.22, y: 0.45 + Math.sin(t) * 0.22, t: i * 16 };
    }),
  },
];

export function MamnouPreview({ phase }: { phase: string }) {
  const canvasRef = useRef<DrawingCanvasHandle | null>(null);
  const deadlines = useMemo(
    () => ({ brief: Date.now() + 8000, draw: Date.now() + 60_000 }),
    [],
  );

  switch (phase) {
    case 'mn-brief':
      return (
        <MamnouBriefScreen
          isArtist
          artistName="حمزة"
          word="قطة"
          forbidden={FORBIDDEN}
          endsAt={deadlines.brief}
          durationMs={8000}
          onReady={noop}
        />
      );

    case 'mn-draw-artist':
      return (
        <MamnouDrawScreen
          isArtist
          word="قطة"
          forbidden={FORBIDDEN}
          hint={letterHint('قطة')}
          selfId="a1"
          players={players}
          strokes={strokes}
          penColor={PEN_COLORS.artist}
          endsAt={deadlines.draw}
          durationMs={75_000}
          guesses={[
            { id: '1', playerId: 'g1', text: 'كلب' },
            { id: '2', playerId: 'g2', text: 'أرنب' },
          ]}
          alreadyCorrect={false}
          onGuess={noop}
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

    case 'mn-draw-guesser':
      return (
        <MamnouDrawScreen
          isArtist={false}
          hint={letterHint('قطة')}
          selfId="g1"
          players={players}
          strokes={strokes}
          penColor={PEN_COLORS.innocent}
          endsAt={deadlines.draw}
          durationMs={75_000}
          guesses={[
            { id: '1', playerId: 'g2', text: 'أرنب' },
            { id: '2', playerId: 'g3', text: 'قطة', correct: true },
          ]}
          alreadyCorrect={false}
          onGuess={noop}
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

    case 'mn-result':
      return (
        <MamnouResultScreen
          word="قطة"
          forbidden={FORBIDDEN}
          strokes={strokes}
          players={players}
          artistId="a1"
          ranked={['g3', 'g1']}
          scores={{ a1: 6, g1: 4, g2: 0, g3: 7 }}
          delta={{ a1: 2, g1: 2, g3: 3 }}
          isHost
          onNextRound={noop}
          onBackToLobby={noop}
        />
      );

    default:
      return null;
  }
}

export const MAMNOU_PREVIEWS = [
  'mn-brief',
  'mn-draw-artist',
  'mn-draw-guesser',
  'mn-result',
] as const;
