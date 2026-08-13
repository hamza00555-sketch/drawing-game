/**
 * AssetSlot — the ONLY way artwork enters the UI.
 *
 * Routing every image through one component is what makes the "no hand-coded
 * artwork" rule enforceable: there is exactly one place that can render a
 * picture, and it can only render files that came from Higgsfield.
 *
 * When an asset has not been generated yet it renders a neutral, clearly
 * labelled box stating which asset is missing. That placeholder is intentionally
 * plain — no emoji, no icon, no improvised drawing — so nobody mistakes it for
 * a design decision, and so a screenshot review immediately shows the gap.
 */

import { getAsset, type AssetId } from './registry';

export interface AssetSlotProps {
  id: AssetId;
  /** Overrides the registry alt text when context makes it more specific. */
  alt?: string;
  className?: string;
  /**
   * Decorative assets are hidden from screen readers. Meaningful ones (a mode
   * illustration, a role reveal) must stay announced.
   */
  decorative?: boolean;
  /** Splash and hero art should not be lazy — everything else should. */
  priority?: boolean;
}

export function AssetSlot({
  id,
  alt,
  className = '',
  decorative = false,
  priority = false,
}: AssetSlotProps) {
  const entry = getAsset(id);

  if (!entry) {
    return (
      <div
        className={`flex min-h-tap items-center justify-center rounded-md border-thin border-dashed border-ink-faint bg-paper-sunken p-3 ${className}`}
        role={decorative ? 'presentation' : 'img'}
        aria-label={decorative ? undefined : `عنصر بصري لم يُولَّد بعد: ${id}`}
        data-asset-placeholder={id}
      >
        <span className="select-all text-center font-body text-xs leading-relaxed text-ink-soft">
          [ASSET: {id}]
        </span>
      </div>
    );
  }

  return (
    <img
      src={entry.src}
      alt={decorative ? '' : (alt ?? entry.alt)}
      width={entry.width}
      height={entry.height}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      draggable={false}
      aria-hidden={decorative || undefined}
    />
  );
}
