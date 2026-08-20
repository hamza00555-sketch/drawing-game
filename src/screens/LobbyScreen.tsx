import { useState } from 'react';
import { GameButton } from '../design/components/GameButton';
import { HostOfflineBanner } from '../design/components/HostOfflineBanner';
import { PlayerAvatar, type PlayerStatus } from '../design/components/PlayerAvatar';
import { Screen } from '../design/components/Screen';
import { ROOM } from '../config/balance';
import { MODE_MIN_PLAYERS } from './ModeSelectScreen';
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
  /** Only called while the host is disconnected — see `HostOfflineBanner`. */
  onTakeHost?: () => void;
  /** Host only: open the room's settings. Absent for everyone else. */
  onSettings?: () => void;
  /**
   * Tries the native share sheet first and falls back to the clipboard,
   * reporting which one actually happened so the lobby only shows "تم النسخ"
   * when a copy is what really occurred — the share sheet already gives its
   * own confirmation.
   */
  onShareCode?: () => Promise<'shared' | 'copied' | 'failed'>;
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
  onTakeHost,
  onSettings,
  onShareCode,
}: LobbyScreenProps) {
  const [justCopied, setJustCopied] = useState(false);
  const roster = Object.values(players).sort((a, b) => a.joinedAt - b.joinedAt);
  const connectedCount = roster.filter((p) => presence[p.id]?.connected).length;
  const hostOnline = presence[hostId]?.connected !== false;

  async function handleShare() {
    const result = await onShareCode?.();
    if (result === 'copied') {
      setJustCopied(true);
      window.setTimeout(() => setJustCopied(false), 2000);
    }
  }

  const isHost = selfId === hostId;
  // Below the room's own floor, no mode can start regardless of what is
  // selected — above it, the gate is per-mode (مزوّر still needs 3).
  const requiredMin = currentMode ? MODE_MIN_PLAYERS[currentMode] : ROOM.minPlayers;
  const enoughPlayers = connectedCount >= requiredMin;
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
        {!hostOnline && !isHost && onTakeHost && <HostOfflineBanner onTakeHost={onTakeHost} />}

        <section className="text-center">
          <p className="font-body text-sm text-ink-soft">كود الغرفة</p>
          <p dir="ltr" className="mt-1 font-display text-3xl tracking-[0.3em] text-ink">
            {code}
          </p>
          <button
            type="button"
            onClick={handleShare}
            className="mt-2 min-h-tap rounded-pill border-thin border-ink-hairline px-4 font-body text-sm text-ink-soft active:translate-y-[1px]"
          >
            {justCopied ? 'تم النسخ' : 'شارك الكود مع أصدقائك'}
          </button>
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
              نحتاج {requiredMin} لاعبين على الأقل
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
              'mt-2 flex min-h-tap w-full items-center justify-between rounded-md p-3',
              'font-body text-base transition-[transform,box-shadow,filter] duration-instant',
              isHost
                ? 'wt-btn-secondary wt-btn-md text-ink shadow-1 active:translate-y-[2px] active:shadow-pressed active:brightness-90'
                : 'border-thin border-ink-hairline bg-paper text-ink-soft',
            ].join(' ')}
          >
            <span className="font-display">
              {currentMode ? MODE_NAMES[currentMode] : 'لم يُختر بعد'}
            </span>
            {isHost && <span className="text-sm text-ink-faint">تغيير</span>}
          </button>

          {onSettings && (
            <button
              type="button"
              onClick={onSettings}
              className="mt-2 min-h-tap w-full rounded-md border-thin border-ink-hairline px-3 font-body text-sm text-ink-soft active:translate-y-[1px]"
            >
              إعدادات الغرفة
            </button>
          )}
        </section>
      </div>
    </Screen>
  );
}
