import { useCallback, useEffect, useState } from 'react';
import { isFirebaseConfigured, ensureSignedIn, getCurrentUid } from '../engine/firebase';
import { startClockSync } from '../engine/clock';
import {
  createRoom,
  joinRoomByCode,
  leaveRoom,
  setRoomMode,
  watchPlayers,
  watchRoom,
  RoomError,
  type GameMode,
  type Room,
} from '../engine/room';
import { startPresence, watchPresence, claimHostIfVacant } from '../engine/presence';
import { CharacterTakenError, takenByOthers, watchCharacters } from '../engine/characters';
import {
  callGame,
  describeCallFailure,
  startRound,
  watchGame,
  watchScores,
  type GameState,
} from '../engine/game';
import type { PresenceRecord, RoomPlayer } from '../engine/presence';
import { GameRouter } from './GameRouter';
import { useSession } from './session';
import { SetupNeededScreen } from './SetupNeededScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { JoinScreen } from '../screens/JoinScreen';
import { LobbyScreen } from '../screens/LobbyScreen';
import { ModeSelectScreen } from '../screens/ModeSelectScreen';

/**
 * App shell and routing.
 *
 * Routing is a plain discriminated union rather than a URL router: this is a
 * single-session party game where a shared link is the room code, not a path,
 * and where a stray back-navigation mid-round would be a bug rather than a
 * feature.
 */

type Route =
  | { name: 'splash' }
  | { name: 'home' }
  | { name: 'create' }
  | { name: 'join' }
  | { name: 'lobby' }
  | { name: 'modeSelect' };

export function App() {
  const [route, setRoute] = useState<Route>({ name: 'splash' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const [room, setRoom] = useState<Room | undefined>(undefined);
  const [players, setPlayers] = useState<Record<string, RoomPlayer>>({});
  const [presence, setPresence] = useState<Record<string, PresenceRecord>>({});
  const [charactersTaken, setCharactersTaken] = useState<Record<string, string>>({});
  const [selfId, setSelfId] = useState<string | undefined>(undefined);
  const [game, setGame] = useState<GameState | undefined>(undefined);
  const [scores, setScores] = useState<Record<string, number>>({});

  const roomId = useSession((state) => state.roomId);
  const setRoomId = useSession((state) => state.setRoomId);

  const configured = isFirebaseConfigured();

  // Clock sync must be running before any timed phase renders a countdown.
  useEffect(() => {
    if (!configured) return;
    startClockSync();
    void ensureSignedIn().then((user) => setSelfId(user.uid));
  }, [configured]);

  // Room subscriptions. Scoped to the narrowest paths so a stroke arriving
  // later cannot wake the player list.
  useEffect(() => {
    if (!roomId) return;

    const stopRoom = watchRoom(roomId, setRoom);
    const stopPlayers = watchPlayers(roomId, setPlayers);
    const stopPresence = watchPresence(roomId, setPresence);
    const stopCharacters = watchCharacters(roomId, setCharactersTaken);
    const stopGame = watchGame(roomId, setGame);
    const stopScores = watchScores(roomId, setScores);

    return () => {
      stopRoom();
      stopPlayers();
      stopPresence();
      stopCharacters();
      stopGame();
      stopScores();
    };
  }, [roomId]);

  // Presence is separate from the subscriptions above because it must also
  // register the onDisconnect handler for this device.
  useEffect(() => {
    if (!roomId || !selfId) return;
    return startPresence(roomId, selfId);
  }, [roomId, selfId]);

  // Host migration. Every client evaluates the same rule from the same data, so
  // they agree on the successor without coordinating; the security rule rejects
  // the write unless the current host really is offline.
  useEffect(() => {
    if (!roomId || !selfId || !room?.hostId) return;
    if (presence[room.hostId]?.connected !== false) return;

    void claimHostIfVacant(roomId, selfId, players, presence);
  }, [roomId, selfId, room?.hostId, players, presence]);

  const handleJoin = useCallback(
    async (input: { name: string; characterId: string; variant: string; code: string }) => {
      setBusy(true);
      setError(undefined);
      try {
        const id =
          input.code.length > 0
            ? await joinRoomByCode(input.code, input)
            : (await createRoom(input)).id;

        setRoomId(id);
        setRoute({ name: 'lobby' });
      } catch (caught) {
        // A lost character race is an ordinary outcome, not a failure: someone
        // simply tapped the same creature a moment earlier.
        setError(
          caught instanceof CharacterTakenError || caught instanceof RoomError
            ? caught.message
            : 'صار خطأ. تأكد من الاتصال وحاول مرة ثانية.',
        );
      } finally {
        setBusy(false);
      }
    },
    [setRoomId],
  );

  const handleLeave = useCallback(async () => {
    const id = roomId;
    const uid = getCurrentUid();
    setRoomId(undefined);
    setRoom(undefined);
    setPlayers({});
    setRoute({ name: 'home' });

    if (id && uid) await leaveRoom(id, uid);
  }, [roomId, setRoomId]);

  if (!configured) return <SetupNeededScreen />;

  /*
   * A live round outranks whatever this device thought it was showing. The
   * server started it, so every member follows — which is also what puts a
   * player who reloaded mid-round straight back into the round instead of into
   * an empty lobby.
   */
  if (roomId && room && selfId && game && route.name !== 'splash') {
    return (
      <GameRouter
        roomId={roomId}
        selfId={selfId}
        hostId={room.hostId}
        players={players}
        game={game}
        scores={scores}
        onNextRound={() => {
          void startRound(roomId, room.currentMode ?? game.mode).catch((caught: unknown) =>
            setError(describeCallFailure(caught).message),
          );
        }}
        onBackToLobby={() => {
          void callGame('returnToLobby', { roomId }).catch(() => undefined);
          setRoute({ name: 'lobby' });
        }}
      />
    );
  }

  switch (route.name) {
    case 'splash':
      return <SplashScreen onDone={() => setRoute({ name: 'home' })} />;

    case 'home':
      return (
        <HomeScreen
          onCreate={() => setRoute({ name: 'create' })}
          onJoin={() => setRoute({ name: 'join' })}
        />
      );

    case 'create':
    case 'join':
      return (
        <JoinScreen
          intent={route.name}
          busy={busy}
          {...(error === undefined ? {} : { error })}
          onBack={() => {
            setError(undefined);
            setRoute({ name: 'home' });
          }}
          onSubmit={(input) => void handleJoin(input)}
          takenIds={takenByOthers(charactersTaken, selfId)}
        />
      );

    case 'modeSelect':
      return (
        <ModeSelectScreen
          {...(room?.currentMode === undefined ? {} : { selected: room.currentMode })}
          onSelect={(mode: GameMode) => {
            if (roomId) void setRoomMode(roomId, mode);
          }}
          onConfirm={() => setRoute({ name: 'lobby' })}
          onBack={() => setRoute({ name: 'lobby' })}
        />
      );

    case 'lobby':
      if (!room || !selfId) {
        return (
          <div className="wt-screen wt-paper-ground items-center justify-center">
            <p className="font-body text-ink-soft">لحظة...</p>
          </div>
        );
      }

      return (
        <LobbyScreen
          code={room.code}
          players={players}
          presence={presence}
          hostId={room.hostId}
          selfId={selfId}
          {...(room.currentMode === undefined ? {} : { currentMode: room.currentMode })}
          onChangeMode={() => setRoute({ name: 'modeSelect' })}
          {...(busy ? { starting: true } : {})}
          {...(error === undefined ? {} : { error })}
          onStart={() => {
            const mode = room.currentMode;
            if (!mode) {
              setRoute({ name: 'modeSelect' });
              return;
            }

            // Only the host may deal a round, and the function checks that
            // again — this is the affordance, not the enforcement.
            setBusy(true);
            setError(undefined);
            void startRound(roomId!, mode)
              .catch((caught: unknown) => setError(describeCallFailure(caught).message))
              .finally(() => setBusy(false));
          }}
          onLeave={() => void handleLeave()}
          onCopyCode={() => void navigator.clipboard?.writeText(room.code)}
        />
      );
  }
}
