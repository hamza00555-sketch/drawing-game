import { GameButton } from '../design/components/GameButton';
import { PlayerAvatar, type PlayerStatus } from '../design/components/PlayerAvatar';
import { Screen } from '../design/components/Screen';
import { ROOM } from '../config/balance';
import type { PresenceRecord, RoomPlayer } from '../engine/presence';
import type { GameMode } from '../engine/room';

/**
 * Lobby.
 *
 * Waiting is part of the game, so the lobby is built to be watched: the cast
 * stands around in their idle poses and the room fills up visibly.
 *
 * The room code is the most important thing on this screen — someone is reading
 * it out loud to a room of people right now — so it gets display type, LTR
 * direction and a tap-to-copy affordance, and nothing competes with it.
 */

const MODE_NAMES: Record<GameMode, string> = {
  mozawwer: 'المزوّر',
  kammil: 'كمّل رسمتي',
  mamnou3at: 'الممنوعات',
  mushtarak: 'الرسم المشترك',
  kanatEsh: 'كانت إيش؟',
};

export interface LobbyScreenProps {
  code: string;
  players: Record<string, RoomPlayer>;
  presence: Record<string, PresenceRecord>;
  hostId: string;
  selfId: string;
  currentMode?: GameMode;
  /** True while the host's start request is in flight. */
  starting?: boolean;
  /** Why the last start attempt failed — shown where the host is looking. */
  error?: string;
  onChangeMode: () => void;
  onStart: () => void;
  onLeave: () => void;
  onCopyCode?: () => void;
}

export function LobbyScreen({
  code,
  players,
  presence,
  hostId,
  selfId,
  currentMode,
  starting = false,
  error,
  onChangeMode,
  onStart,
  onLeave,
  onCopyCode,
}: LobbyScreenProps) {
  const roster = Object.values(players).sort((a, b) => a.joinedAt - b.joinedAt);
  const connectedCount = roster.filter((p) => presence[p.id]?.connected).length;

  const isHost = selfId === hostId;
  const enoughPlayers = connectedCount >= ROOM.minPlayers;
  const canStart = isHost && enoughPlayers && Boolean(currentMode);

  function statusOf(player: RoomPlayer): PlayerStatus {
    if (presence[player.id]?.connected === false) return 'disconnected';
    return player.ready ? 'ready' : 'idle';
  }

  return (
    <Screen
      footer={
        <>
          {/*
           * The failure belongs next to the button that caused it. A host who
           * taps "ابدأ" and sees nothing happen assumes the tap was missed.
           */}
          {error && (
            <p className="text-center font-body text-sm text-tomato-deep" role="alert">
              {error}
            </p>
          )}

          {isHost ? (
            <GameButton
              tone="primary"
              size="lg"
              block
              disabled={!canStart || starting}
              onClick={onStart}
            >
              {starting ? 'نوزّع الأدوار' : 'ابدأ'}
            </GameButton>
          ) : (
            <p className="text-center font-body text-sm text-ink-soft">
              في انتظار المضيف يبدأ
            </p>
          )}

          <button
            type="button"
            onClick={onLeave}
            className="min-h-tap font-body text-sm text-ink-faint underline underline-offset-4"
          >
            اخرج من الغرفة
          </button>
        </>
      }
    >
      <div className="flex flex-1 flex-col gap-5 py-4">
        <section className="text-center">
          <p className="font-body text-sm text-ink-soft">كود الغرفة</p>
          <button
            type="button"
            onClick={onCopyCode}
            dir="ltr"
            className="mt-1 min-h-tap font-display text-3xl tracking-[0.3em] text-ink"
          >
            {code}
          </button>
          <p className="font-body text-xs text-ink-faint">شاركه مع أصدقائك</p>
        </section>

        {/*
         * The roster absorbs the spare height so that "choose a mode" sits
         * directly above "start" — they are one action sequence, and leaving a
         * dead band between them reads as a broken layout on a tall phone.
         */}
        <section className="flex-1">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg text-ink">اللاعبون</h2>
            <span className="font-body text-sm text-ink-faint">
              {connectedCount} من {ROOM.maxPlayers}
            </span>
          </div>

          <ul className="mt-3 grid list-none grid-cols-3 gap-3 p-0 sm:grid-cols-4">
            {roster.map((player) => (
              // min-w-0 lets the cell shrink below its content's intrinsic
              // width, which is what makes the name's truncate actually apply.
              <li key={player.id} className="min-w-0">
                <PlayerAvatar
                  characterId={player.characterId}
                  name={player.name}
                  variant={(player as RoomPlayer & { variant?: string }).variant ?? 'default'}
                  status={statusOf(player)}
                  isHost={player.id === hostId}
                />
              </li>
            ))}
          </ul>

          {!enoughPlayers && (
            <p className="mt-3 font-body text-sm text-ink-soft">
              نحتاج {ROOM.minPlayers} لاعبين على الأقل
            </p>
          )}
        </section>

        <section>
          <h2 className="font-display text-lg text-ink">نمط اللعب</h2>

          <button
            type="button"
            onClick={onChangeMode}
            disabled={!isHost}
            className={[
              'mt-2 flex min-h-tap w-full items-center justify-between rounded-md border-bold p-3',
              'font-body text-base transition-[transform,box-shadow] duration-instant',
              isHost
                ? 'border-ink bg-paper-raised text-ink shadow-1 active:translate-y-[2px] active:shadow-pressed'
                : 'border-ink-hairline bg-paper text-ink-soft',
            ].join(' ')}
          >
            <span className="font-display">
              {currentMode ? MODE_NAMES[currentMode] : 'لم يُختر بعد'}
            </span>
            {isHost && <span className="text-sm text-ink-faint">تغيير</span>}
          </button>
        </section>
      </div>
    </Screen>
  );
}
