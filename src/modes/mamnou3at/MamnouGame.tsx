import { useEffect, useRef, useState } from 'react';
import { penColorFor } from '../../design/penColors';
import { useDrawingSession } from '../../engine/canvas/useDrawingSession';
import type { DrawingCanvasHandle } from '../../design/components/DrawingCanvas';
import { callGame, watchGuesses, type GuessRecord } from '../../engine/game';
import { useDeadline, usePlayerSecret, type LiveRoundProps } from '../liveRound';
import { MAMNOU3AT } from '../../../shared/mamnou3at';
import { MamnouBriefScreen } from './screens/MamnouBriefScreen';
import { MamnouDrawScreen } from './screens/MamnouDrawScreen';
import { MamnouResultScreen } from './screens/MamnouResultScreen';

/**
 * الممنوعات, live.
 *
 * Guessing runs alongside drawing here, which is the mode — the artist watches
 * wrong answers arrive and has to steer without the one word that would fix it.
 *
 * So every guess is a round trip to the server, and that is not an oversight:
 * judging a guess needs the word, and the whole point is that the guessers do
 * not have it. Their device holds a letter count. Correctness comes back as a
 * fact, not a comparison they could have run themselves.
 */
export function MamnouGame({
  roomId,
  selfId,
  hostId,
  players,
  game,
  scores,
  onBackToLobby,
  onNextRound,
}: LiveRoundProps) {
  const canvasRef = useRef<DrawingCanvasHandle | null>(null);
  const secret = usePlayerSecret(roomId, game.gameId, selfId);
  const [guesses, setGuesses] = useState<GuessRecord[]>([]);

  const isHost = selfId === hostId;
  const isArtist = game.artistId === selfId;

  const session = useDrawingSession({
    roomId,
    gameId: game.gameId,
    playerId: selfId,
    canvas: canvasRef,
  });

  useEffect(() => watchGuesses(roomId, game.gameId, setGuesses), [roomId, game.gameId]);

  useDeadline(game.phaseEndsAt, game.phase === 'brief' && isHost, () =>
    void callGame('beginMamnouDrawing', { roomId }).catch(() => undefined),
  );
  useDeadline(game.phaseEndsAt, game.phase === 'draw' && isHost, () =>
    void callGame('endMamnouRound', { roomId }).catch(() => undefined),
  );

  switch (game.phase) {
    case 'brief':
      return (
        <MamnouBriefScreen
          isArtist={isArtist}
          artistName={players[game.artistId ?? '']?.name ?? ''}
          word={secret?.word ?? ''}
          forbidden={secret?.forbidden ?? []}
          endsAt={game.phaseEndsAt}
          durationMs={MAMNOU3AT.briefMs}
          onReady={() => {
            // The artist has read the list and wants to start. The host's
            // deadline is the backstop if they never tap.
            if (isArtist || isHost) {
              void callGame('beginMamnouDrawing', { roomId }).catch(() => undefined);
            }
          }}
        />
      );

    case 'draw':
      return (
        <MamnouDrawScreen
          isArtist={isArtist}
          {...(secret?.word === undefined ? {} : { word: secret.word })}
          {...(secret?.forbidden === undefined ? {} : { forbidden: secret.forbidden })}
          // Server-computed. Deriving it here would mean shipping the answer.
          hint={secret?.hint ?? ''}
          selfId={selfId}
          players={players}
          strokes={session.strokes}
          penColor={penColorFor(players[selfId]?.characterId)}
          endsAt={game.phaseEndsAt}
          durationMs={MAMNOU3AT.drawMs}
          // Newest first: the artist is reading the last thing said, not a log.
          guesses={[...guesses].reverse()}
          alreadyCorrect={guesses.some((g) => g.playerId === selfId && g.correct)}
          onGuess={(text) =>
            void callGame('submitMamnouGuess', { roomId, guess: text }).catch(() => undefined)
          }
          onStrokeStart={session.onStrokeStart}
          onStrokePoint={session.onStrokePoint}
          onStrokeEnd={session.onStrokeEnd}
          onUndo={session.undo}
          canUndo={session.canUndo}
          nextSeq={session.nextSeq}
          now={session.now}
          canvasRef={canvasRef}
        />
      );

    default:
      return (
        <MamnouResultScreen
          word={game.revealedWord ?? ''}
          forbidden={game.revealedForbidden ?? []}
          strokes={session.strokes}
          players={players}
          artistId={game.artistId ?? ''}
          ranked={game.ranked ?? []}
          scores={scores}
          delta={game.scoreDelta ?? {}}
          isHost={isHost}
          onNextRound={onNextRound}
          onBackToLobby={onBackToLobby}
        />
      );
  }
}
