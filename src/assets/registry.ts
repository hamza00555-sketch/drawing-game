/**
 * Asset registry — the single source of truth mapping an asset id to a file.
 *
 * Rules:
 *   - Every entry's file lives in `src/assets/generated/` and was produced with
 *     Higgsfield following ART_BIBLE.md. Nothing here is hand-drawn.
 *   - Every entry must also exist in ASSET_MANIFEST.md with its prompt.
 *   - An id with no entry yet is not an error: <AssetSlot /> renders a neutral
 *     labelled placeholder so the screen can be built and reviewed before the
 *     artwork lands.
 *
 * Imports are static so Vite fingerprints and bundles them. Do not build these
 * paths dynamically — a runtime string would silently ship a broken image.
 */

import artistIdle from './generated/char_artist_idle.webp';
import detectiveIdle from './generated/char_detective_idle.webp';
import confusedIdle from './generated/char_confused_idle.webp';
import excitedIdle from './generated/char_excited_idle.webp';
import innocentIdle from './generated/char_innocent_idle.webp';
import criticIdle from './generated/char_critic_idle.webp';

export type AssetId = string;

export interface AssetEntry {
  /** Imported URL of the generated file. */
  src: string;
  /** Arabic alt text. Required — these carry meaning, not decoration. */
  alt: string;
  /** Intrinsic size, used to reserve space and avoid layout shift. */
  width: number;
  height: number;
}

export const assetRegistry: Readonly<Record<AssetId, AssetEntry>> = {
  char_artist_idle: {
    src: artistIdle,
    alt: 'الفنان المتفلسف',
    width: 394,
    height: 900,
  },
  char_detective_idle: {
    src: detectiveIdle,
    alt: 'المحقق',
    width: 858,
    height: 900,
  },
  char_confused_idle: {
    src: confusedIdle,
    alt: 'الملخبط',
    width: 588,
    height: 900,
  },
  char_excited_idle: {
    src: excitedIdle,
    alt: 'المتحمس',
    width: 900,
    height: 889,
  },
  char_innocent_idle: {
    src: innocentIdle,
    alt: 'البريء المشبوه',
    width: 564,
    height: 900,
  },
  char_critic_idle: {
    src: criticIdle,
    alt: 'الناقد',
    width: 320,
    height: 900,
  },
};

export function getAsset(id: AssetId): AssetEntry | undefined {
  return assetRegistry[id];
}
