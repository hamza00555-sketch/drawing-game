/**
 * Dev-only previews for each phase of المزوّر.
 *
 * Every phase against fixed data, so the whole arc can be reviewed at 320px
 * without assembling five devices and a live round.
 */

import { useRef, useState } from 'react';
import type { DrawingCanvasHandle } from '../design/components/DrawingCanvas';
import { RoleRevealScreen } from '../modes/mozawwer/screens/RoleRevealScreen';
import { MozawwerDrawScreen } from '../modes/mozawwer/screens/MozawwerDrawScreen';
import { VotingScreen } from '../modes/mozawwer/screens/VotingScreen';
import { RevealScreen } from '../modes/mozawwer/screens/RevealScreen';
import { ImpostorGuessScreen } from '../modes/mozawwer/screens/ImpostorGuessScreen';
import { ResultScreen } from '../modes/mozawwer/screens/ResultScreen';
import { PEN_COLORS } from '../design/penColors';
import type { RoomPlayer } from '../engine/presence';
import type { Stroke } from '../engine/canvas/strokes';

const players: Record<string, RoomPlayer> = {
  p1: { id: 'p1', name: 'حمزة', characterId: 'artist', joinedAt: 1 },
  p2: { id: 'p2', name: 'نورة', characterId: 'innocent', joinedAt: 2 },
  p3: { id: 'p3', name: 'سعد', characterId: 'excited', joinedAt: 3 },
  p4: { id: 'p4', name: 'لمى', characterId: 'detective', joinedAt: 4 },
};

const turnOrder = ['p1', 'p2', 'p3', 'p4'];
const noop = () => undefined;

// Far enough out that the bar reads as "plenty of time" in a screenshot.
const soon = () => Date.now() + 18_000;

const strokes: Stroke[] = [
  {
    id: 's1',
    playerId: 'p1',
    seq: 0,
    tool: 'pen',
    color: PEN_COLORS.artist,
    width: 0.012,
    startedAt: 0,
    points: Array.from({ length: 30 }, (_, i) => ({
      x: 0.2 + i * 0.02,
      y: 0.4 + Math.sin(i / 4) * 0.1,
      t: i * 16,
    })),
  },
];

export function MozawwerPreview({ phase }: { phase: string }) {
  const canvasRef = useRef<DrawingCanvasHandle | null>(null);
  const [vote, setVote] = useState<string | undefined>(undefined);

  switch (phase) {
    case 'mz-role-artist':
      return <RoleRevealScreen word="دلة" isImpostor={false} onReady={noop} />;

    case 'mz-role-impostor':
      return <RoleRevealScreen isImpostor onReady={noop} />;

    case 'mz-draw':
      return (
        <MozawwerDrawScreen
          word="دلة"
          isImpostor={false}
          selfId="p1"
          activePlayerId="p1"
          players={players}
          turnOrder={turnOrder}
          strokes={strokes}
          penColor={PEN_COLORS.artist}
          turnEndsAt={soon()}
          turnDurationMs={20_000}
          canOfferReady={false}
          onEndTurn={noop}
          onReadyToVote={noop}
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

    case 'mz-watch':
      return (
        <MozawwerDrawScreen
          isImpostor
          selfId="p1"
          activePlayerId="p3"
          players={players}
          turnOrder={turnOrder}
          strokes={strokes}
          penColor={PEN_COLORS.artist}
          turnEndsAt={soon()}
          turnDurationMs={20_000}
          canOfferReady
          onEndTurn={noop}
          onReadyToVote={noop}
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

    case 'mz-vote':
      return (
        <VotingScreen
          players={players}
          selfId="p1"
          myVote={vote}
          votedIds={['p2', 'p3']}
          endsAt={soon()}
          durationMs={30_000}
          onVote={setVote}
        />
      );

    case 'mz-reveal':
      return (
        <RevealScreen
          players={players}
          accusedId="p4"
          impostorId="p4"
          word="دلة"
          voteCounts={{ p4: 3, p2: 1 }}
        />
      );

    case 'mz-guess':
      return (
        <ImpostorGuessScreen
          isImpostor
          impostorName="لمى"
          endsAt={soon()}
          durationMs={20_000}
          onGuess={noop}
        />
      );

    case 'mz-result':
      return (
        <ResultScreen
          players={players}
          scores={{ p1: 7, p2: 5, p3: 3, p4: 3 }}
          delta={{ p1: 3, p2: 3, p3: 1, p4: 3 }}
          impostorId="p4"
          word="دلة"
          caught
          impostorGuessedWord
          isHost
          onNextRound={noop}
          onBackToLobby={noop}
        />
      );

    default:
      return null;
  }
}

export const MOZAWWER_PREVIEWS = [
  'mz-role-artist',
  'mz-role-impostor',
  'mz-draw',
  'mz-watch',
  'mz-vote',
  'mz-reveal',
  'mz-guess',
  'mz-result',
] as const;
