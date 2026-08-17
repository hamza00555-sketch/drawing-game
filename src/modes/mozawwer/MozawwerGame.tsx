import { useEffect, useRef, useState } from 'react';
import { DrawingCanvas, type DrawingCanvasHandle } from '../../design/components/DrawingCanvas';
import { penColorFor } from '../../design/penColors';
import { useDrawingSession } from '../../engine/canvas/useDrawingSession';
import { callGame, castVote, watchVoteMarks } from '../../engine/game';
import { useDeadline, usePlayerSecret, type LiveRoundProps } from '../liveRound';
import { canOfferReady, type MozawwerState } from './rules';
import { MOZAWWER } from '../../../shared/mozawwer';
import { RoleRevealScreen } from './screens/RoleRevealScreen';
import { MozawwerDrawScreen } from './screens/MozawwerDrawScreen';
import { VotingScreen } from './screens/VotingScreen';
import { RevealScreen } from './screens/RevealScreen';
import { ImpostorGuessScreen } from './screens/ImpostorGuessScreen';
import { ResultScreen } from './screens/ResultScreen';

/**
 * المزوّر, live.
 *
 * The one thing to keep straight while reading this file: **nothing here knows
 * who the impostor is.** Not the props, not the state, not a hidden flag on the
 * game node. This device knows only what arrived in its own `playerSecret`, and
 * for the impostor that payload has no `word` key at all. The identity of the
 * impostor reaches every screen exactly once — in the reveal, after the vote is
 * closed and the server publishes it.
 */

type Advance = Record<string, unknown>;

export function MozawwerGame({
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

  const [confirmedRole, setConfirmedRole] = useState(false);
  const [myVote, setMyVote] = useState<string | undefined>(undefined);
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [guessSubmitted, setGuessSubmitted] = useState(false);

  const isHost = selfId === hostId;
  const isImpostor = secret?.role === 'impostor';

  const settings = { ...MOZAWWER, ...(game.settings as Partial<typeof MOZAWWER> | undefined) };
  const turnOrder = game.turnOrder ?? [];

  const state: MozawwerState = {
    phase: game.phase as MozawwerState['phase'],
    turnOrder,
    turnIndex: game.turnIndex ?? 0,
    turnsTaken: game.turnsTaken ?? 0,
    readyToVote: [],
  };

  const session = useDrawingSession({
    roomId,
    gameId: game.gameId,
    playerId: selfId,
    canvas: canvasRef,
  });

  const advance = (data: Advance) =>
    void callGame('advanceMozawwer', { roomId, ...data }).catch(() => undefined);

  useEffect(() => {
    if (game.phase !== 'vote') return;
    return watchVoteMarks(roomId, game.gameId, setVotedIds);
  }, [roomId, game.gameId, game.phase]);

  const isMyTurn = game.currentPlayerId === selfId;

  // Each timer is owned by exactly one device, so a phase change is requested
  // once rather than by everyone at the same instant.
  useDeadline(game.phaseEndsAt, game.phase === 'draw' && isMyTurn, () =>
    advance({ action: 'endTurn' }),
  );
  useDeadline(game.phaseEndsAt, game.phase === 'vote' && isHost, () =>
    advance({ action: 'closeVoting' }),
  );
  useDeadline(game.phaseEndsAt, game.phase === 'reveal' && isHost, () =>
    advance({ action: 'afterReveal' }),
  );
  useDeadline(game.phaseEndsAt, game.phase === 'impostorGuess' && isHost, () =>
    advance({ action: 'closeImpostorGuess' }),
  );

  // Everyone has voted: no reason to sit out the rest of the timer.
  const connectedCount = Object.keys(players).length;
  useEffect(() => {
    if (game.phase !== 'vote' || !isHost) return;
    if (votedIds.length < connectedCount) return;

    void callGame('advanceMozawwer', { roomId, action: 'closeVoting' }).catch(() => undefined);
  }, [roomId, game.phase, isHost, votedIds.length, connectedCount]);

  switch (game.phase) {
    case 'roleReveal':
      return (
        <RoleRevealScreen
          {...(secret?.word === undefined ? {} : { word: secret.word })}
          isImpostor={isImpostor}
          waiting={confirmedRole}
          onReady={() => {
            setConfirmedRole(true);
            /*
             * The host's confirmation is what starts the drawing. Someone has to
             * hold the group, and around a table that is always the person who
             * made the room — a rule where the FIRST tap starts the round would
             * yank the screen away from whoever was still reading their role.
             */
            if (isHost) advance({ action: 'beginDrawing' });
          }}
        />
      );

    case 'draw':
      return (
        <MozawwerDrawScreen
          {...(secret?.word === undefined ? {} : { word: secret.word })}
          isImpostor={isImpostor}
          selfId={selfId}
          activePlayerId={game.currentPlayerId ?? undefined}
          players={players}
          turnOrder={turnOrder}
          strokes={session.strokes}
          penColor={penColorFor(players[selfId]?.characterId)}
          turnEndsAt={game.phaseEndsAt}
          turnDurationMs={settings.turnMs}
          canOfferReady={canOfferReady(state, settings.minTurnsBeforeReady)}
          onEndTurn={() => advance({ action: 'endTurn' })}
          onReadyToVote={() => advance({ action: 'readyToVote' })}
          onStrokeStart={session.onStrokeStart}
          onStrokePoint={session.onStrokePoint}
          onStrokeEnd={session.onStrokeEnd}
          onUndo={session.undo}
          canUndo={session.canUndo && isMyTurn}
          nextSeq={session.nextSeq}
          now={session.now}
          canvasRef={canvasRef}
        />
      );

    case 'vote':
      return (
        <VotingScreen
          players={players}
          selfId={selfId}
          myVote={myVote}
          votedIds={votedIds}
          endsAt={game.phaseEndsAt}
          durationMs={settings.votingMs}
          onVote={(targetId) => {
            // Optimistic: the rules allow exactly one vote, so a second tap
            // would be refused anyway, and waiting on the round trip to grey
            // out the buttons reads as a dropped tap.
            setMyVote(targetId);
            void castVote(roomId, game.gameId, selfId, targetId).catch(() =>
              setMyVote(undefined),
            );
          }}
        />
      );

    case 'reveal':
      return (
        <RevealScreen
          players={players}
          accusedId={game.accusedId ?? undefined}
          impostorId={game.impostorId ?? ''}
          word={game.revealedWord ?? ''}
          voteCounts={game.voteCounts ?? {}}
        />
      );

    case 'impostorGuess':
      return (
        <ImpostorGuessScreen
          isImpostor={isImpostor}
          impostorName={players[game.impostorId ?? '']?.name ?? ''}
          endsAt={game.phaseEndsAt}
          durationMs={settings.impostorGuessMs}
          submitted={guessSubmitted}
          onGuess={(guess) => {
            setGuessSubmitted(true);
            advance({ action: 'impostorGuess', guess });
          }}
        />
      );

    case 'result':
      return (
        <ResultScreen
          players={players}
          scores={scores}
          delta={game.scoreDelta ?? {}}
          impostorId={game.impostorId ?? ''}
          word={game.revealedWord ?? ''}
          caught={Boolean(game.caught)}
          impostorGuessedWord={Boolean(game.impostorGuessedWord)}
          isHost={isHost}
          onNextRound={onNextRound}
          onBackToLobby={onBackToLobby}
          onChangeMode={onChangeMode}
        />
      );

    default:
      // A phase this build does not know about. Rendering the canvas keeps the
      // drawing on screen rather than blanking the room mid-round.
      return (
        <div className="wt-screen wt-paper-ground p-4">
          <div className="relative flex-1 rounded-md border-bold border-ink">
            <DrawingCanvas
              ref={canvasRef}
              enabled={false}
              tool="pen"
              color={penColorFor(players[selfId]?.characterId)}
              width={0.012}
              playerId={selfId}
              strokes={session.strokes}
              nextSeq={session.nextSeq}
              now={session.now}
              onStrokeStart={session.onStrokeStart}
              onStrokePoint={session.onStrokePoint}
              onStrokeEnd={session.onStrokeEnd}
            />
          </div>
        </div>
      );
  }
}
