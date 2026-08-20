import { useEffect, useRef, useState } from 'react';
import { penColorFor } from '../../design/penColors';
import { useDrawingSession } from '../../engine/canvas/useDrawingSession';
import type { DrawingCanvasHandle } from '../../design/components/DrawingCanvas';
import { callGame } from '../../engine/game';
import { useDeadline, usePlayerSecret, type LiveRoundProps } from '../liveRound';
import { KAMMIL, kammilDrawMs } from '../../../shared/kammil';
import { KammilDrawScreen } from './screens/KammilDrawScreen';
import { KammilGuessScreen } from './screens/KammilGuessScreen';
import { KammilRevealScreen } from './screens/KammilRevealScreen';
import { RoundScoresScreen } from '../../screens/RoundScoresScreen';

/**
 * كمّل رسمتي, live.
 *
 * This is the mode where timing is the game, so the container's real job is to
 * make sure every deadline is claimed by exactly one device and never missed:
 *
 *   - the countdown ends → whoever's pen it is asks for the pen to unlock
 *   - the turn ends → the same player closes their own turn
 *   - the host shadows both, so a player who walks away cannot freeze the room
 *
 * Both callers send the turn they believe is ending, and the server discards a
 * stale one. Without that, artist and host firing together would skip a turn.
 */
export function KammilGame({
  roomId,
  selfId,
  hostId,
  players,
  game,
  scores,
  onBackToLobby,
  onNextRound,
  onChangeMode,
}: LiveRoundProps) {
  const canvasRef = useRef<DrawingCanvasHandle | null>(null);
  const secret = usePlayerSecret(roomId, game.gameId, selfId);
  const [guessSubmitted, setGuessSubmitted] = useState(false);

  const isHost = selfId === hostId;
  const artistIds = game.artistIds ?? [];
  const isDuo = Boolean(game.isDuo);
  const isGuesser = game.guesserId === selfId;
  const isMyTurn = game.currentPlayerId === selfId;

  const turnMs = game.turnMs ?? kammilDrawMs(artistIds.length);
  const countdownMs = game.countdownMs ?? KAMMIL.countdownMs;

  // A guess wrong enough to earn a bonus window comes back here a second
  // time — this component stays mounted through the whole round, so the
  // "already submitted" flag has to clear itself on every fresh entry into
  // `guess`, not just the first one.
  useEffect(() => {
    if (game.phase === 'guess') setGuessSubmitted(false);
  }, [game.phase]);

  const session = useDrawingSession({
    roomId,
    gameId: game.gameId,
    playerId: selfId,
    canvas: canvasRef,
  });

  const advance = (data: Record<string, unknown>) =>
    void callGame('advanceKammil', { roomId, ...data }).catch(() => undefined);

  const endTurn = () => advance({ action: 'endTurn', turnIndex: game.turnIndex ?? 0 });

  // The countdown and the turn are both watched by the artist and shadowed by
  // the host. `startTurn` is naturally idempotent; `endTurn` is made so by the
  // turnIndex it carries.
  useDeadline(
    game.phaseEndsAt,
    game.phase === 'countdown' && (isMyTurn || isHost),
    () => advance({ action: 'startTurn' }),
  );
  useDeadline(game.phaseEndsAt, game.phase === 'turn' && (isMyTurn || isHost), endTurn);
  useDeadline(game.phaseEndsAt, game.phase === 'guess' && isHost, () =>
    advance({ action: 'closeGuess' }),
  );

  switch (game.phase) {
    case 'countdown':
    case 'turn':
      return (
        <KammilDrawScreen
          {...(secret?.word === undefined ? {} : { word: secret.word })}
          isGuesser={isGuesser}
          counting={game.phase === 'countdown'}
          isDuo={isDuo}
          stage={game.stage ?? 0}
          totalStages={game.totalStages ?? 1}
          {...(game.lastGuess ? { lastGuess: game.lastGuess } : {})}
          selfId={selfId}
          currentArtistId={game.currentPlayerId ?? undefined}
          players={players}
          artistIds={artistIds}
          strokes={session.strokes}
          penColor={penColorFor(players[selfId]?.characterId)}
          phaseEndsAt={game.phaseEndsAt}
          turnDurationMs={turnMs}
          countdownDurationMs={countdownMs}
          onCountdownComplete={() => {
            if (isMyTurn || isHost) advance({ action: 'startTurn' });
          }}
          onTurnExpire={() => {
            if (isMyTurn || isHost) endTurn();
          }}
          onStrokeStart={session.onStrokeStart}
          onStrokePoint={session.onStrokePoint}
          onStrokeEnd={session.onStrokeEnd}
          nextSeq={session.nextSeq}
          now={session.now}
          canvasRef={canvasRef}
        />
      );

    case 'guess':
      return (
        <KammilGuessScreen
          isGuesser={isGuesser}
          guesserName={players[game.guesserId ?? '']?.name ?? ''}
          strokes={session.strokes}
          endsAt={game.phaseEndsAt}
          durationMs={isDuo ? KAMMIL.duo.guessMs : KAMMIL.guessMs}
          isDuo={isDuo}
          stage={game.stage ?? 0}
          totalStages={game.totalStages ?? 1}
          submitted={guessSubmitted}
          onGuess={(guess) => {
            setGuessSubmitted(true);
            advance({ action: 'submitGuess', guess });
          }}
        />
      );

    case 'reveal':
      return (
        <KammilRevealScreen
          word={game.revealedWord ?? ''}
          guess={game.guess ?? ''}
          correct={Boolean(game.correct)}
          guesserName={players[game.guesserId ?? '']?.name ?? ''}
          players={players}
          strokes={session.strokes}
          isDuo={isDuo}
          isHost={isHost}
          onContinue={() => advance({ action: 'toResult' })}
        />
      );

    default:
      return (
        <RoundScoresScreen
          headline={game.correct ? 'عرفها' : 'ما عرفها'}
          detail={`الكلمة كانت ${game.revealedWord ?? ''}`}
          players={players}
          scores={scores}
          delta={game.scoreDelta ?? {}}
          isHost={isHost}
          onNextRound={onNextRound}
          onBackToLobby={onBackToLobby}
          onChangeMode={onChangeMode}
        />
      );
  }
}
