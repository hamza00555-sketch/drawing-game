import { GameButton } from './GameButton';

/**
 * Shown to every connected player except the host, whenever the host's own
 * presence record says disconnected.
 *
 * There is no background process that hands hosting to someone else — see
 * `takeHost` in `engine/presence.ts`. The room just waits, and whoever wants
 * to unstick it taps this. If the host reconnects, their own presence flips
 * back to connected and this banner disappears on its own — nothing to undo.
 */
export interface HostOfflineBannerProps {
  onTakeHost: () => void;
}

export function HostOfflineBanner({ onTakeHost }: HostOfflineBannerProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border-bold border-ink-hairline bg-paper-raised px-3 py-2">
      <p className="min-w-0 font-body text-sm text-ink-soft">المضيف غير متصل</p>
      <GameButton tone="accent" size="sm" onClick={onTakeHost}>
        خذ الاستضافة
      </GameButton>
    </div>
  );
}
