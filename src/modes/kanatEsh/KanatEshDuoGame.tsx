import { useEffect, useRef, useState } from 'react';
import { penColorFor } from '../../design/penColors';
import { Screen } from '../../design/components/Screen';
import { GameButton } from '../../design/components/GameButton';
import type { DrawingCanvasHandle } from '../../design/components/DrawingCanvas';
import { useDrawingSession } from '../../engine/canvas/useDrawingSession';
import { readStrokesOnce } from '../../engine/canvas/strokeSync';
import type { Stroke } from '../../engine/canvas/strokes';
import { paths } from '../../engine/paths';
import {
  callGame,
  watchDuoChain,
  watchDuoChainLink,
  type ChainLinkRecord,
} from '../../engine/game';
import { useDeadline, usePlayerSecret, type LiveRoundProps } from '../liveRound';
import { KANAT_ESH, linkTypeAt, readableLinkIndex } from './rules';
import { KanatEshTurnScreen } from './screens/KanatEshTurnScreen';
import { DuoJourneyPoster } from './screens/DuoJourneyPoster';
import { RoundScoresScreen } from '../../screens/RoundScoresScreen';

type Track = '0' | '1';

/**
 * One track's worth of live state: the single readable previous link, its
 * strokes if it's a drawing, and — once the round reveals — the whole chain
 * with every drawing link's strokes resolved for the poster.
 *
 * Pulled out as its own hook (rather than looping `useEffect` calls by track
 * inside the container) so both tracks get an identical, independently
 * testable slice of logic without ever varying how many hooks render calls —
 * this hook itself is called exactly twice, unconditionally, in the
 * container below.
 */
function useKanatEshDuoTrack(
  roomId: string,
  gameId: string,
  track: Track,
  phase: string,
  isMyTurn: boolean,
  currentIndex: number,
) {
  const [previousLink, setPreviousLink] = useState<ChainLinkRecord | undefined>(undefined);
  const [previousStrokes, setPreviousStrokes] = useState<Stroke[]>([]);
  const [chain, setChain] = useState<ChainLinkRecord[]>([]);
  const [posterStrokes, setPosterStrokes] = useState<Record<number, Stroke[]>>({});

  const previousIndex = readableLinkIndex(currentIndex);

  useEffect(() => {
    if (phase !== 'turn' || !isMyTurn) {
      setPreviousLink(undefined);
      return;
    }
    return watchDuoChainLink(roomId, gameId, track, previousIndex, setPreviousLink);
  }, [roomId, gameId, track, phase, isMyTurn, previousIndex]);

  useEffect(() => {
    if (!previousLink || previousLink.type !== 'drawing') {
      setPreviousStrokes([]);
      return;
    }
    let cancelled = false;
    void readStrokesOnce(paths.duoLinkStrokes(roomId, gameId, track, previousLink.index)).then(
      (strokes) => {
        if (!cancelled) setPreviousStrokes(strokes);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [roomId, gameId, track, previousLink]);

  useEffect(() => {
    if (phase !== 'reveal' && phase !== 'result') return;
    return watchDuoChain(roomId, gameId, track, setChain);
  }, [roomId, gameId, track, phase]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      chain
        .filter((link) => link.type === 'drawing')
        .map(async (link) => {
          const strokes = await readStrokesOnce(
            paths.duoLinkStrokes(roomId, gameId, track, link.index),
          );
          return [link.index, strokes] as const;
        }),
    ).then((entries) => {
      if (!cancelled) setPosterStrokes(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [roomId, gameId, track, chain]);

  return { previousLink, previousStrokes, chain, posterStrokes };
}

/**
 * كانت إيش؟ Duo, live.
 *
 * Two independent chains instead of one, each seeded by one player's own
 * word. Because the two tracks advance on their own schedules — nothing
 * forces them to stay in lockstep — a player can in principle owe a move on
 * BOTH at once. Rather than build a two-canvas split screen for a case that
 * is rare in practice, this shows ONE track's turn screen at a time,
 * preferring whichever one is actually waiting on this player; the other
 * track's deadline keeps running underneath regardless of what's on screen —
 * `useDeadline` is armed for both tracks unconditionally, every render.
 */
export function KanatEshDuoGame({
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
  const canvasRefA = useRef<DrawingCanvasHandle | null>(null);
  const canvasRefB = useRef<DrawingCanvasHandle | null>(null);

  const isHost = selfId === hostId;
  const trackA = game.tracks?.['0'];
  const trackB = game.tracks?.['1'];

  usePlayerSecret(roomId, game.gameId, selfId);

  const isMyTurnA = Boolean(trackA) && !trackA?.done && trackA?.currentPlayerId === selfId;
  const isMyTurnB = Boolean(trackB) && !trackB?.done && trackB?.currentPlayerId === selfId;

  const stateA = useKanatEshDuoTrack(
    roomId,
    game.gameId,
    '0',
    game.phase,
    isMyTurnA,
    trackA?.currentIndex ?? 1,
  );
  const stateB = useKanatEshDuoTrack(
    roomId,
    game.gameId,
    '1',
    game.phase,
    isMyTurnB,
    trackB?.currentIndex ?? 1,
  );

  const sessionA = useDrawingSession({
    roomId,
    gameId: game.gameId,
    playerId: selfId,
    canvas: canvasRefA,
    bucketPath: paths.duoLinkStrokes(roomId, game.gameId, '0', trackA?.currentIndex ?? 1),
  });
  const sessionB = useDrawingSession({
    roomId,
    gameId: game.gameId,
    playerId: selfId,
    canvas: canvasRefB,
    bucketPath: paths.duoLinkStrokes(roomId, game.gameId, '1', trackB?.currentIndex ?? 1),
  });

  const submit = (track: Track, text?: string) =>
    void callGame('submitKanatEshLinkDuo', {
      roomId,
      track,
      ...(text === undefined ? {} : { text }),
    }).catch(() => undefined);

  // Both tracks' deadlines are armed unconditionally — a track not currently
  // on screen still has to close out on time.
  useDeadline(
    trackA?.phaseEndsAt,
    game.phase === 'turn' && !trackA?.done && (isMyTurnA || isHost),
    () => submit('0', isMyTurnA && linkTypeAt(trackA?.currentIndex ?? 1) === 'text' ? '' : undefined),
  );
  useDeadline(
    trackB?.phaseEndsAt,
    game.phase === 'turn' && !trackB?.done && (isMyTurnB || isHost),
    () => submit('1', isMyTurnB && linkTypeAt(trackB?.currentIndex ?? 1) === 'text' ? '' : undefined),
  );

  if (game.phase === 'turn') {
    // Prefer a track that's actually waiting on this player; otherwise show
    // whichever track is still active, so there is always something on
    // screen instead of a blank state between the two chains' own paces.
    const showA = isMyTurnA || (!isMyTurnB && !trackA?.done);
    const displayTrack: Track = showA ? '0' : '1';
    const trackState = showA ? trackA : trackB;
    const trackData = showA ? stateA : stateB;
    const canvasRef = showA ? canvasRefA : canvasRefB;
    const session = showA ? sessionA : sessionB;
    const isMyTurn = showA ? isMyTurnA : isMyTurnB;
    const bothPending = isMyTurnA && isMyTurnB;

    const currentIndex = trackState?.currentIndex ?? 1;
    const linkType = linkTypeAt(currentIndex);
    const link = trackData.previousLink;

    return (
      <div className="flex flex-1 flex-col">
        {bothPending && (
          <p className="bg-mustard px-3 py-1 text-center font-body text-xs text-ink">
            عندك دور في المسارين — هذا الأول، والثاني بعده
          </p>
        )}
        <KanatEshTurnScreen
          linkType={linkType}
          {...(link?.type === 'text' ? { previousText: link.content } : {})}
          {...(trackData.previousStrokes.length > 0
            ? { previousStrokes: trackData.previousStrokes }
            : {})}
          isMyTurn={isMyTurn}
          currentAuthorName={players[trackState?.currentPlayerId ?? '']?.name ?? ''}
          position={currentIndex}
          totalLinks={trackState?.totalLinks ?? game.linksPerTrack ?? 0}
          selfId={selfId}
          strokes={session.strokes}
          penColor={penColorFor(players[selfId]?.characterId)}
          endsAt={trackState?.phaseEndsAt}
          durationMs={linkType === 'drawing' ? KANAT_ESH.duo.drawMs : KANAT_ESH.duo.writeMs}
          onSubmitText={(text) => submit(displayTrack, text)}
          onSubmitDrawing={() => submit(displayTrack)}
          onStrokeStart={session.onStrokeStart}
          onStrokePoint={session.onStrokePoint}
          onStrokeEnd={session.onStrokeEnd}
          onUndo={session.undo}
          canUndo={session.canUndo}
          nextSeq={session.nextSeq}
          now={session.now}
          canvasRef={canvasRef}
        />
      </div>
    );
  }

  if (game.phase === 'reveal') {
    const buildLinks = (state: typeof stateA) =>
      state.chain
        .filter((link) => link.index > 0)
        .map((link) => ({
          index: link.index,
          type: link.type,
          playerId: link.playerId,
          ...(link.type === 'text'
            ? { text: link.content }
            : { strokes: state.posterStrokes[link.index] ?? [] }),
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
          <DuoJourneyPoster
            seedA={game.seedA ?? ''}
            seedB={game.seedB ?? ''}
            linksA={buildLinks(stateA)}
            linksB={buildLinks(stateB)}
            players={players}
          />
        </div>
      </Screen>
    );
  }

  return (
    <RoundScoresScreen
      headline="وصلتوا للنهاية"
      detail={`${game.seedA ?? ''} + ${game.seedB ?? ''}`}
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
