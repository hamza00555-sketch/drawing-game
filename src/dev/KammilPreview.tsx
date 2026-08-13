/**
 * Dev-only previews for كمّل رسمتي.
 *
 * The countdown and the replay are both time-driven, so they cannot be reviewed
 * from static markup — these run the real components against fixed strokes.
 */

import { useMemo, useRef } from 'react';
import type { DrawingCanvasHandle } from '../design/components/DrawingCanvas';
import { KammilDrawScreen } from '../modes/kammil/screens/KammilDrawScreen';
import { KammilGuessScreen } from '../modes/kammil/screens/KammilGuessScreen';
import { KammilRevealScreen } from '../modes/kammil/screens/KammilRevealScreen';
import { PEN_COLORS } from '../design/penColors';
import type { RoomPlayer } from '../engine/presence';
import type { Stroke } from '../engine/canvas/strokes';

const players: Record<string, RoomPlayer> = {
  p1: { id: 'p1', name: 'حمزة', characterId: 'artist', joinedAt: 1 },
  p2: { id: 'p2', name: 'نورة', characterId: 'innocent', joinedAt: 2 },
  p3: { id: 'p3', name: 'سعد', characterId: 'excited', joinedAt: 3 },
  p4: { id: 'p4', name: 'لمى', characterId: 'detective', joinedAt: 4 },
};

const artistIds = ['p1', 'p2', 'p3'];
const noop = () => undefined;

/** Three contributions by three authors, so replay grouping is exercised. */
const strokes: Stroke[] = artistIds.flatMap((playerId, index) => [
  {
    id: `s${index}`,
    playerId,
    seq: index,
    tool: 'pen' as const,
    color: Object.values(PEN_COLORS)[index] as string,
    width: 0.014,
    startedAt: index * 1000,
    points: Array.from({ length: 24 }, (_, i) => ({
      x: 0.15 + i * 0.028,
      y: 0.28 + index * 0.2 + Math.sin(i / 3 + index) * 0.06,
      t: i * 20,
    })),
  },
]);

export function KammilPreview({ phase }: { phase: string }) {
  const canvasRef = useRef<DrawingCanvasHandle | null>(null);

  /*
   * Deadlines must be computed ONCE. Recomputing them per render pushes the
   * deadline forward every frame, so the countdown's remaining time never
   * decreases smoothly — it oscillates through zero, unmounting the overlay and
   * restarting its exit animation. In the real game these come from the
   * database and are stable by construction.
   */
  const deadlines = useMemo(
    () => ({ countdown: Date.now() + 3000, turn: Date.now() + 3200, guess: Date.now() + 20_000 }),
    [],
  );

  switch (phase) {
    case 'km-countdown':
      return (
        <KammilDrawScreen
          word="جمل"
          isGuesser={false}
          counting
          selfId="p1"
          currentArtistId="p1"
          players={players}
          artistIds={artistIds}
          strokes={strokes.slice(0, 1)}
          penColor={PEN_COLORS.artist}
          phaseEndsAt={deadlines.countdown}
          turnDurationMs={4000}
          countdownDurationMs={3000}
          onCountdownComplete={noop}
          onTurnExpire={noop}
          onStrokeStart={noop}
          onStrokePoint={noop}
          onStrokeEnd={noop}
          nextSeq={() => 9}
          now={() => Date.now()}
          canvasRef={canvasRef}
        />
      );

    case 'km-turn':
      return (
        <KammilDrawScreen
          word="جمل"
          isGuesser={false}
          counting={false}
          selfId="p1"
          currentArtistId="p1"
          players={players}
          artistIds={artistIds}
          strokes={strokes.slice(0, 2)}
          penColor={PEN_COLORS.artist}
          phaseEndsAt={deadlines.turn}
          turnDurationMs={4000}
          countdownDurationMs={3000}
          onCountdownComplete={noop}
          onTurnExpire={noop}
          onStrokeStart={noop}
          onStrokePoint={noop}
          onStrokeEnd={noop}
          nextSeq={() => 9}
          now={() => Date.now()}
          canvasRef={canvasRef}
        />
      );

    case 'km-guess':
      return (
        <KammilGuessScreen
          isGuesser
          guesserName="لمى"
          strokes={strokes}
          endsAt={deadlines.guess}
          durationMs={25_000}
          onGuess={noop}
        />
      );

    case 'km-reveal':
      return (
        <KammilRevealScreen
          word="جمل"
          guess="دودة"
          correct={false}
          guesserName="لمى"
          players={players}
          strokes={strokes}
          onContinue={noop}
          isHost
        />
      );

    default:
      return null;
  }
}

export const KAMMIL_PREVIEWS = ['km-countdown', 'km-turn', 'km-guess', 'km-reveal'] as const;
