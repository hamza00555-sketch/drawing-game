import { useEffect, useRef, useState } from 'react';
import { penColorFor } from '../../design/penColors';
import { Screen } from '../../design/components/Screen';
import { GameButton } from '../../design/components/GameButton';
import type { DrawingCanvasHandle } from '../../design/components/DrawingCanvas';
import { useDrawingSession } from '../../engine/canvas/useDrawingSession';
import { readStrokesOnce } from '../../engine/canvas/strokeSync';
import type { Stroke } from '../../engine/canvas/strokes';
import { paths } from '../../engine/paths';
import { callGame, watchChain, watchChainLink, type ChainLinkRecord } from '../../engine/game';
import { useDeadline, usePlayerSecret, type LiveRoundProps } from '../liveRound';
import { KANAT_ESH, linkTypeAt, readableLinkIndex } from './rules';
import { KanatEshTurnScreen } from './screens/KanatEshTurnScreen';
import { JourneyPoster, type JourneyLink } from './screens/JourneyPoster';
import { RoundScoresScreen } from '../../screens/RoundScoresScreen';

/**
 * كانت إيش؟, live.
 *
 * Every read in this file is deliberately narrow. The client asks for exactly
 * one chain link — the one feeding this turn — and exactly one stroke bucket,
 * because asking for the parent node would be refused wholesale and, if it were
 * not, would hand the player the entire chain. The database enforces this; the
 * code here is written so that it never even asks for more.
 *
 * Drawings do not go on the shared canvas. Each link draws into its own bucket
 * under `linkStrokes`, gated by the same grant as the link text — otherwise a
 * player could read every earlier drawing and work backwards to the sentence
 * the room started from, which is the one thing the mode cannot survive.
 */
export function KanatEshGame({
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

  const currentIndex = game.currentIndex ?? 1;
  const totalLinks = game.totalLinks ?? 0;
  const linkType = linkTypeAt(currentIndex);
  const isMyTurn = game.currentPlayerId === selfId;
  const isHost = selfId === hostId;

  // Present for symmetry with the other modes: this mode keeps nothing in
  // playerSecrets, because its secret is the shape of the chain, not a word.
  usePlayerSecret(roomId, game.gameId, selfId);

  const [previousLink, setPreviousLink] = useState<ChainLinkRecord | undefined>(undefined);
  const [previousStrokes, setPreviousStrokes] = useState<Stroke[]>([]);
  const [chain, setChain] = useState<ChainLinkRecord[]>([]);
  const [posterStrokes, setPosterStrokes] = useState<Record<number, Stroke[]>>({});

  const session = useDrawingSession({
    roomId,
    gameId: game.gameId,
    playerId: selfId,
    canvas: canvasRef,
    bucketPath: paths.linkStrokes(roomId, game.gameId, currentIndex),
  });

  const previousIndex = readableLinkIndex(currentIndex);

  // The single link this player is entitled to. Only fetched on their own turn:
  // the read would be refused otherwise, and asking anyway would be noise.
  useEffect(() => {
    if (game.phase !== 'turn' || !isMyTurn) {
      setPreviousLink(undefined);
      return;
    }
    return watchChainLink(roomId, game.gameId, previousIndex, setPreviousLink);
  }, [roomId, game.gameId, game.phase, isMyTurn, previousIndex]);

  useEffect(() => {
    if (!previousLink || previousLink.type !== 'drawing') {
      setPreviousStrokes([]);
      return;
    }

    let cancelled = false;
    void readStrokesOnce(paths.linkStrokes(roomId, game.gameId, previousLink.index)).then(
      (strokes) => {
        if (!cancelled) setPreviousStrokes(strokes);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [roomId, game.gameId, previousLink]);

  // At the reveal the whole chain opens at once, and only then.
  useEffect(() => {
    if (game.phase !== 'reveal' && game.phase !== 'result') return;
    return watchChain(roomId, game.gameId, setChain);
  }, [roomId, game.gameId, game.phase]);

  useEffect(() => {
    let cancelled = false;

    void Promise.all(
      chain
        .filter((link) => link.type === 'drawing')
        .map(async (link) => {
          const strokes = await readStrokesOnce(
            paths.linkStrokes(roomId, game.gameId, link.index),
          );
          return [link.index, strokes] as const;
        }),
    ).then((entries) => {
      if (!cancelled) setPosterStrokes(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [roomId, game.gameId, chain]);

  const submit = (text?: string) =>
    void callGame('submitKanatEshLink', {
      roomId,
      ...(text === undefined ? {} : { text }),
    }).catch(() => undefined);

  /*
   * The author closes their own turn on time. The host shadows the deadline so
   * a chain does not stall behind someone who put their phone down — the server
   * accepts that second caller only after the deadline has actually passed.
   */
  useDeadline(game.phaseEndsAt, game.phase === 'turn' && (isMyTurn || isHost), () =>
    submit(isMyTurn && linkType === 'text' ? '' : undefined),
  );

  if (game.phase === 'turn') {
    return (
      <KanatEshTurnScreen
        linkType={linkType}
        {...(previousLink?.type === 'text' ? { previousText: previousLink.content } : {})}
        {...(previousStrokes.length > 0 ? { previousStrokes } : {})}
        isMyTurn={isMyTurn}
        currentAuthorName={players[game.currentPlayerId ?? '']?.name ?? ''}
        position={currentIndex}
        totalLinks={totalLinks}
        selfId={selfId}
        strokes={session.strokes}
        penColor={penColorFor(players[selfId]?.characterId)}
        endsAt={game.phaseEndsAt}
        durationMs={linkType === 'drawing' ? KANAT_ESH.drawMs : KANAT_ESH.writeMs}
        onSubmitText={(text) => submit(text)}
        onSubmitDrawing={() => submit()}
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
  }

  if (game.phase === 'reveal') {
    const links: JourneyLink[] = chain
      // Link 0 is the seed, shown as the poster's opening line rather than as a
      // link in the body.
      .filter((link) => link.index > 0)
      .map((link) => ({
        index: link.index,
        type: link.type,
        playerId: link.playerId,
        ...(link.type === 'text'
          ? { text: link.content }
          : { strokes: posterStrokes[link.index] ?? [] }),
      }));

    return (
      <Screen
        footer={
          isHost ? (
            <GameButton
              tone="primary"
              size="lg"
              block
              onClick={() => void callGame('kanatEshToResult', { roomId }).catch(() => undefined)}
            >
              النتيجة
            </GameButton>
          ) : (
            <p className="text-center font-body text-sm text-ink-soft">في انتظار المضيف</p>
          )
        }
      >
        <div className="py-2">
          <JourneyPoster seed={game.seed ?? ''} links={links} players={players} />
        </div>
      </Screen>
    );
  }

  return (
    <RoundScoresScreen
      headline="وصلنا للنهاية"
      detail={game.seed ?? ''}
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
