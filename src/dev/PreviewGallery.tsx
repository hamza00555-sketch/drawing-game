/**
 * Dev-only screen gallery.
 *
 * Renders each screen against fixed mock data so layout can be reviewed —
 * including at 320px, with long names and RTL — without standing up a room and
 * five devices. Reachable at `?preview=<screen>` in development only; it is
 * tree-shaken out of production builds by the `import.meta.env.DEV` guard in
 * main.tsx.
 */

import { HomeScreen } from '../screens/HomeScreen';
import { JoinScreen } from '../screens/JoinScreen';
import { LobbyScreen } from '../screens/LobbyScreen';
import { ModeSelectScreen } from '../screens/ModeSelectScreen';
import { DrawingPreview } from './DrawingPreview';
import type { PresenceRecord, RoomPlayer } from '../engine/presence';

const players: Record<string, RoomPlayer> = {
  p1: { id: 'p1', name: 'حمزة', characterId: 'artist', joinedAt: 1, ready: true },
  p2: {
    id: 'p2',
    name: 'عبدالرحمن الشمري',
    characterId: 'detective',
    joinedAt: 2,
    ready: true,
  },
  p3: { id: 'p3', name: 'نورة', characterId: 'innocent', joinedAt: 3, ready: false },
  p4: { id: 'p4', name: 'سعد', characterId: 'excited', joinedAt: 4, ready: true },
  p5: { id: 'p5', name: 'لمى', characterId: 'confused', joinedAt: 5, ready: false },
};

const presence: Record<string, PresenceRecord> = {
  p1: { connected: true, lastSeen: 0 },
  p2: { connected: true, lastSeen: 0 },
  p3: { connected: true, lastSeen: 0 },
  p4: { connected: false, lastSeen: 0 },
  p5: { connected: true, lastSeen: 0 },
};

const noop = () => undefined;

export function PreviewGallery({ screen }: { screen: string }) {
  switch (screen) {
    case 'home':
      return <HomeScreen onCreate={noop} onJoin={noop} onSettings={noop} />;

    case 'create':
      return <JoinScreen intent="create" onSubmit={noop} onBack={noop} />;

    case 'join':
      return (
        <JoinScreen
          intent="join"
          onSubmit={noop}
          onBack={noop}
          takenIds={['artist', 'excited']}
          error="ما لقينا غرفة بهذا الرمز."
        />
      );

    case 'lobby':
      return (
        <LobbyScreen
          code="K7QM"
          players={players}
          presence={presence}
          hostId="p1"
          selfId="p1"
          currentMode="mozawwer"
          onChangeMode={noop}
          onStart={noop}
          onLeave={noop}
        />
      );

    case 'lobby-empty':
      return (
        <LobbyScreen
          code="K7QM"
          players={{ p1: players.p1 as RoomPlayer }}
          presence={{ p1: presence.p1 as PresenceRecord }}
          hostId="p1"
          selfId="p1"
          onChangeMode={noop}
          onStart={noop}
          onLeave={noop}
        />
      );

    case 'draw':
      return <DrawingPreview />;

    case 'modes':
      return (
        <ModeSelectScreen
          selected="mozawwer"
          onSelect={noop}
          onConfirm={noop}
          onBack={noop}
        />
      );

    default:
      return (
        <main className="wt-screen wt-paper-ground">
          <ul className="font-body text-ink">
            {['home', 'create', 'join', 'lobby', 'lobby-empty', 'modes', 'draw'].map((name) => (
              <li key={name}>
                <a className="underline" href={`?preview=${name}`}>
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </main>
      );
  }
}
