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
import { useDrawingWidths } from '../../engine/useDrawingWidths';
import { useDeadline, usePlayerSecret, type LiveRoundProps } from '../liveRound';
import { KANAT_ESH, linkTypeAt, readableLinkIndex } from './rules';
import { KanatEshTurnScreen } from './screens/KanatEshTurnScreen';
import { DuoJourneyPoster } from './screens/DuoJourneyPoster';
import { RoundScoresScreen } from '../../screens/RoundScoresScreen';

type Track = '0' | '1';
const TRACKS: readonly Track[] = ['0', '1'];

/**
 * كانت إيش؟ Duo, live.
 *
 * Two chains, one seeded from each player's own word, run in LOCKSTEP: they
 * share an index and a deadline, and because the author alternates on each
 * track, at any index the two tracks have different authors. So each player
 * is always working on exactly one chain — their own this turn, their
 * partner's the next — and never owes two moves at once.
 *
 * That is the whole reason this container can look like the single-chain one:
 * find the track where it is my turn, show that turn, done.
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
  const canvasRef = useRef<DrawingCanvasHandle | null>(null);
  const widths = useDrawingWidths(roomId);

  const isHost = selfId === hostId;
  const currentIndex = game.currentIndex ?? 1;
  const totalLinks = game.linksPerTrack ?? 0;
  const linkType = linkTypeAt(currentIndex);

  usePlayerSecret(roomId, game.gameId, selfId);

  /** The track this player authors at the current index, if any. */
  const myTrack = TRACKS.find(
    (track) => game.tracks?.[track]?.authorByIndex?.[String(currentIndex)] === selfId,
  );
  const alreadyFiled = myTrack
    ? Boolean(game.submitted?.[String(currentIndex)]?.[myTrack])
    : false;
  const isMyTurn = Boolean(myTrack) && !alreadyFiled;

  const [previousLink, setPreviousLink] = useState<ChainLinkRecord | undefined>(undefined);
  const [previousStrokes, setPreviousStrokes] = useState<Stroke[]>([]);
  const [chains, setChains] = useState<Record<Track, ChainLinkRecord[]>>({ '0': [], '1': [] });
  const [posterStrokes, setPosterStrokes] = useState<Record<Track, Record<number, Stroke[]>>>({
    '0': {},
    '1': {},
  });

  const session = useDrawingSession({
    roomId,
    gameId: game.gameId,
    playerId: selfId,
    canvas: canvasRef,
    bucketPath: paths.duoLinkStrokes(roomId, game.gameId, myTrack ?? '0', currentIndex),
  });

  const previousIndex = readableLinkIndex(currentIndex);

  // The single link this player is entitled to, on their own track only.
  useEffect(() => {
    if (game.phase !== 'turn' || !isMyTurn || !myTrack) {
      setPreviousLink(undefined);
      return;
    }
    return watchDuoChainLink(roomId, game.gameId, myTrack, previousIndex, setPreviousLink);
  }, [roomId, game.gameId, game.phase, isMyTurn, myTrack, previousIndex]);

  useEffect(() => {
    if (!previousLink || previousLink.type !== 'drawing' || !myTrack) {
      setPreviousStrokes([]);
      return;
    }
    let cancelled = false;
    void readStrokesOnce(
      paths.duoLinkStrokes(roomId, game.gameId, myTrack, previousLink.index),
    ).then((strokes) => {
      if (!cancelled) setPreviousStrokes(strokes);
    });
    return () => {
      cancelled = true;
    };
  }, [roomId, game.gameId, myTrack, previousLink]);

  // At the reveal both chains open at once, and only then.
  useEffect(() => {
    if (game.phase !== 'reveal' && game.phase !== 'result') return;
    const stops = TRACKS.map((track) =>
      watchDuoChain(roomId, game.gameId, track, (links) =>
        setChains((prev) => ({ ...prev, [track]: links })),
      ),
    );
    return () => stops.forEach((stop) => stop());
  }, [roomId, game.gameId, game.phase]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      TRACKS.map(async (track) => {
        const entries = await Promise.all(
          chains[track]
            .filter((link) => link.type === 'drawing')
            .map(async (link) => {
              const strokes = await readStrokesOnce(
                paths.duoLinkStrokes(roomId, game.gameId, track, link.index),
              );
              return [link.index, strokes] as const;
            }),
        );
        return [track, Object.fromEntries(entries)] as const;
      }),
    ).then((pairs) => {
      if (!cancelled) {
        setPosterStrokes(
          Object.fromEntries(pairs) as Record<Track, Record<number, Stroke[]>>,
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [roomId, game.gameId, chains]);

  const submit = (text?: string) =>
    void callGame('submitKanatEshLinkDuo', {
      roomId,
      track: myTrack ?? '0',
      ...(text === undefined ? {} : { text }),
    }).catch(() => undefined);

  /*
   * The author closes their own turn on time; the host shadows the shared
   * deadline so a chain does not stall behind someone who put their phone
   * down. The server only accepts that second caller once the deadline has
   * actually passed.
   */
  useDeadline(game.phaseEndsAt, game.phase === 'turn' && (isMyTurn || isHost), () =>
    submit(isMyTurn && linkType === 'text' ? '' : undefined),
  );

  if (game.phase === 'turn') {
    return (
      <KanatEshTurnScreen
          penWidth={widths.penWidth}
          eraserWidth={widths.eraserWidth}
        linkType={linkType}
        {...(previousLink?.type === 'text' ? { previousText: previousLink.content } : {})}
        {...(previousStrokes.length > 0 ? { previousStrokes } : {})}
        isMyTurn={isMyTurn}
        // Waiting on the partner, not on a named "current author" — both
        // players move at once here.
        currentAuthorName={alreadyFiled ? 'صاحبك' : ''}
        position={currentIndex}
        totalLinks={totalLinks}
        selfId={selfId}
        strokes={session.strokes}
        penColor={penColorFor(players[selfId]?.characterId)}
        endsAt={game.phaseEndsAt}
        durationMs={
          linkType === 'drawing'
            ? (game.drawMs ?? KANAT_ESH.duo.drawMs)
            : (game.writeMs ?? KANAT_ESH.duo.writeMs)
        }
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
    const buildLinks = (track: Track) =>
      chains[track]
        .filter((link) => link.index > 0)
        .map((link) => ({
          index: link.index,
          type: link.type,
          playerId: link.playerId,
          ...(link.type === 'text'
            ? { text: link.content }
            : { strokes: posterStrokes[track][link.index] ?? [] }),
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
            linksA={buildLinks('0')}
            linksB={buildLinks('1')}
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
