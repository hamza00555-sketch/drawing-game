import { PlayerAvatar } from '../../../design/components/PlayerAvatar';
import { Screen } from '../../../design/components/Screen';
import { Timer } from '../../../design/components/Timer';
import type { RoomPlayer } from '../../../engine/presence';

/**
 * المزوّر — voting.
 *
 * A vote is final once cast: the security rule refuses a second write, and the
 * UI matches that rather than pretending the choice is still open. Letting
 * players re-pick would also turn the phase into a staring contest over who
 * commits last.
 *
 * Tallies stay hidden until the reveal — seeing a running count would let the
 * room pile onto whoever was accused first.
 */

export interface VotingScreenProps {
  players: Record<string, RoomPlayer>;
  selfId: string;
  /** Who this player voted for, once they have. */
  myVote: string | undefined;
  /** Player ids who have voted, for the progress line only — not who they picked. */
  votedIds: readonly string[];
  endsAt: number | null | undefined;
  durationMs: number;
  onVote: (targetId: string) => void;
}

export function VotingScreen({
  players,
  selfId,
  myVote,
  votedIds,
  endsAt,
  durationMs,
  onVote,
}: VotingScreenProps) {
  // You cannot vote for yourself: it is never a real accusation, only a way to
  // dodge committing to one.
  const candidates = Object.values(players).filter((player) => player.id !== selfId);
  const voted = new Set(votedIds);

  return (
    <Screen
      footer={
        <p className="text-center font-body text-sm text-ink-soft">
          {myVote ? 'في انتظار البقية...' : 'اختر واحد'}
        </p>
      }
    >
      <div className="flex flex-1 flex-col justify-center gap-5 py-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="font-display text-2xl text-ink">مين المزوّر؟</h1>
            <span className="shrink-0 font-body text-sm text-ink-soft">
              صوّت {voted.size} من {Object.keys(players).length}
            </span>
          </div>
          {/* Full width: squeezed beside the heading the bar was unreadable. */}
          <Timer endsAt={endsAt} durationMs={durationMs} />
        </div>

        <ul className="grid list-none grid-cols-2 content-start gap-3 p-0">
          {candidates.map((player) => {
            const chosen = myVote === player.id;

            return (
              <li key={player.id} className="min-w-0">
                <button
                  type="button"
                  // Once cast, the vote is locked — matching the rule that
                  // refuses a second write.
                  disabled={Boolean(myVote)}
                  onClick={() => onVote(player.id)}
                  aria-pressed={chosen}
                  className={[
                    'flex w-full flex-col items-center gap-1 rounded-md border-bold p-2',
                    'transition-[transform,box-shadow] duration-instant ease-bounce',
                    chosen
                      ? 'border-tomato bg-paper-raised shadow-2'
                      : 'border-ink-hairline bg-paper',
                    myVote && !chosen
                      ? 'opacity-45'
                      : 'active:translate-y-[2px] active:shadow-pressed',
                  ].join(' ')}
                >
                  <PlayerAvatar
                    characterId={player.characterId}
                    name={player.name}
                    pose="suspicious"
                    size="md"
                    status={voted.has(player.id) ? 'ready' : 'idle'}
                  />
                  {chosen && (
                    <span className="font-body text-xs text-tomato-deep">صوتك</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Screen>
  );
}
