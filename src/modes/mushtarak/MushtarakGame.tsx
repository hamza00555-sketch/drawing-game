import { useEffect, useMemo, useRef, useState } from 'react';
import { penColorFor } from '../../design/penColors';
import { useDrawingSession } from '../../engine/canvas/useDrawingSession';
import type { DrawingCanvasHandle } from '../../design/components/DrawingCanvas';
import { callGame, watchGuesses, type GuessRecord } from '../../engine/game';
import { useDeadline, usePlayerSecret, type LiveRoundProps } from '../liveRound';
import { MUSHTARAK, canSendGotYou, type MushtarakState } from './rules';
import { MamnouBriefScreen } from '../mamnou3at/screens/MamnouBriefScreen';
import { MushtarakDrawScreen } from './screens/MushtarakDrawScreen';
import { MushtarakRevealScreen } from './screens/MushtarakRevealScreen';
import { RoundScoresScreen } from '../../screens/RoundScoresScreen';
import { MushtarakGuessScreen } from './screens/MushtarakGuessScreen';

/**
 * الرسم المشترك, live.
 *
 * Two pens on one canvas, each artist holding half an idea and neither able to
 * see the other's half. The container's part in that is small and strict: it
 * passes this device's own `part` and never assembles the whole phrase, because
 * this device was never sent the other half to assemble it from.
 *
 * Pen colour is the only record of who drew what, and it comes from the
 * character each player reserved — which the room already guarantees is unique.
 */
export function MushtarakGame({
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
  const [guesses, setGuesses] = useState<GuessRecord[]>([]);
  const [guessSubmitted, setGuessSubmitted] = useState(false);

  const isHost = selfId === hostId;
  const artistIds = game.artistIds ?? [];
  const isArtist = artistIds.includes(selfId);
  const isDuo = Boolean(game.isDuo);
  const isMyTurn = game.currentPlayerId === selfId;

  const state: MushtarakState = {
    phase: game.phase as MushtarakState['phase'],
    artistIds: [...artistIds],
    guesserIds: [...(game.guesserIds ?? [])],
    isDuo,
    ...(game.currentPlayerId ? { currentPlayerId: game.currentPlayerId } : {}),
  };

  const penColors = useMemo(
    () =>
      Object.fromEntries(
        artistIds.map((id) => [id, penColorFor(players[id]?.characterId)]),
      ) as Record<string, string>,
    [artistIds, players],
  );

  const session = useDrawingSession({
    roomId,
    gameId: game.gameId,
    playerId: selfId,
    canvas: canvasRef,
  });

  const advance = (data: Record<string, unknown>) =>
    void callGame('advanceMushtarak', { roomId, ...data }).catch(() => undefined);

  useEffect(() => {
    if (game.phase !== 'guess') return;
    return watchGuesses(roomId, game.gameId, setGuesses);
  }, [roomId, game.gameId, game.phase]);

  useDeadline(game.phaseEndsAt, game.phase === 'brief' && isHost, () =>
    advance({ action: 'beginDrawing' }),
  );
  // Duo: each short turn is closed by whoever's turn it is, shadowed by the
  // host — same split-responsibility pattern كمّل رسمتي uses for its turns.
  useDeadline(game.phaseEndsAt, game.phase === 'draw' && isDuo && (isMyTurn || isHost), () =>
    advance({ action: 'endTurn', turnIndex: game.turnIndex ?? 0 }),
  );
  useDeadline(game.phaseEndsAt, game.phase === 'draw' && !isDuo && isHost, () =>
    advance({ action: 'endDrawing' }),
  );
  useDeadline(game.phaseEndsAt, game.phase === 'guess' && isHost, () =>
    advance({ action: 'toReveal' }),
  );

  switch (game.phase) {
    case 'brief':
      /*
       * The brief screen is borrowed from الممنوعات rather than rebuilt: the job
       * is identical — read your private instruction before the pen opens — and
       * a second screen saying the same thing in the same layout would be two
       * places to keep in step for no gain. Here there is no forbidden list, so
       * it passes none.
       */
      return (
        <MamnouBriefScreen
          isArtist={isArtist}
          artistName={artistIds.map((id) => players[id]?.name ?? '').join(' و')}
          word={secret?.part ?? ''}
          forbidden={[]}
          endsAt={game.phaseEndsAt}
          durationMs={isDuo ? MUSHTARAK.duo.briefMs : MUSHTARAK.briefMs}
          onReady={() => {
            if (isHost) advance({ action: 'beginDrawing' });
          }}
        />
      );

    case 'draw':
      return (
        <MushtarakDrawScreen
          {...(secret?.part === undefined ? {} : { myPart: secret.part })}
          isArtist={isArtist}
          isDuo={isDuo}
          isMyTurn={isMyTurn}
          turnIndex={game.turnIndex ?? 0}
          totalSwaps={game.totalSwaps ?? MUSHTARAK.duo.totalSwaps}
          selfId={selfId}
          players={players}
          artistIds={artistIds}
          penColors={penColors}
          strokes={session.strokes}
          endsAt={game.phaseEndsAt}
          durationMs={isDuo ? (game.turnMs ?? MUSHTARAK.duo.turnMs) : MUSHTARAK.drawMs}
          gotYouUsedBy={Object.keys(game.gotYouUsedBy ?? {})}
          gotYouFrom={game.gotYouFrom}
          canSendGotYou={canSendGotYou(
            state,
            selfId,
            Object.keys(game.gotYouUsedBy ?? {}),
            MUSHTARAK.gotYouUsesPerArtist,
          )}
          onSendGotYou={() => advance({ action: 'gotYou' })}
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

    case 'guess': {
      // Duo inverts this: the artists ARE the guessers, each naming the half
      // their partner held.
      const partnerId = artistIds.find((id) => id !== selfId);
      const partnerName = partnerId ? (players[partnerId]?.name ?? '') : '';

      return (
        <MushtarakGuessScreen
          canGuess={isDuo ? isArtist : !isArtist}
          isDuo={isDuo}
          partnerName={partnerName}
          watchingName={
            isDuo ? partnerName : artistIds.map((id) => players[id]?.name ?? '').join(' و')
          }
          strokes={session.strokes}
          endsAt={game.phaseEndsAt}
          durationMs={isDuo ? MUSHTARAK.duo.guessMs : MUSHTARAK.guessMs}
          submitted={guessSubmitted || guesses.some((g) => g.playerId === selfId)}
          onGuess={(guess) => {
            setGuessSubmitted(true);
            advance({ action: 'submitGuess', guess });
          }}
        />
      );
    }

    case 'reveal':
      return (
        <MushtarakRevealScreen
          partA={game.partA ?? ''}
          partB={game.partB ?? ''}
          full={game.full ?? ''}
          artistIds={artistIds}
          penColors={penColors}
          players={players}
          strokes={session.strokes}
          correctGuesserIds={game.correctGuesserIds ?? []}
          isDuo={isDuo}
          isHost={isHost}
          onContinue={() => advance({ action: 'toResult' })}
        />
      );

    default:
      return (
        <RoundScoresScreen
          headline={
            isDuo
              ? (game.correctGuesserIds ?? []).length === 2
                ? 'فهمتوا بعض'
                : (game.correctGuesserIds ?? []).length === 1
                  ? 'واحد بس فهم'
                  : 'ما فهمتوا بعض'
              : (game.correctGuesserIds ?? []).length > 0
                ? 'وصلت الفكرة'
                : 'ما وصلت'
          }
          detail={game.full ?? ''}
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
