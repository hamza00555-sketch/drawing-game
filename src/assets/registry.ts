/**
 * Asset registry — the single source of truth mapping an asset id to a file.
 *
 * ID SCHEME: `{character}_{variant}_{pose}`
 *
 *   artist_default_idle
 *   detective_saudi_suspicious
 *   innocent_hijab_confused
 *
 * The variant slot exists so a costume is a swap, never a second character.
 * A Saudi-dressed detective is the SAME detective — see ART_BIBLE.md §14.
 * Non-character art keeps a descriptive id (`hero_home_confused_group`).
 *
 * Rules:
 *   - Every file lives in `src/assets/generated/` and was produced with
 *     Higgsfield following ART_BIBLE.md. Nothing here is hand-drawn.
 *   - Every entry must also exist in ASSET_MANIFEST.md with its prompt.
 *   - An id with no entry is not an error: <AssetSlot /> renders a neutral
 *     labelled placeholder so a screen can be built and reviewed before the
 *     artwork lands.
 *
 * Imports are static so Vite fingerprints and bundles them. Never build these
 * paths dynamically — a runtime string would silently ship a broken image.
 */

import artistDefaultIdle from './generated/artist_default_idle.webp';
import criticDefaultIdle from './generated/critic_default_idle.webp';
import confusedDefaultIdle from './generated/confused_default_idle.webp';
import excitedDefaultIdle from './generated/excited_default_idle.webp';
import innocentDefaultIdle from './generated/innocent_default_idle.webp';
import detectiveDefaultIdle from './generated/detective_default_idle.webp';
import detectiveSaudiIdle from './generated/detective_saudi_idle.webp';
import innocentHijabIdle from './generated/innocent_hijab_idle.webp';

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
  artist_default_idle: {
    src: artistDefaultIdle,
    alt: 'الفنان المتفلسف',
    width: 394,
    height: 900,
  },
  critic_default_idle: {
    src: criticDefaultIdle,
    alt: 'الناقد',
    width: 858,
    height: 900,
  },
  confused_default_idle: {
    src: confusedDefaultIdle,
    alt: 'الملخبط',
    width: 588,
    height: 900,
  },
  excited_default_idle: {
    src: excitedDefaultIdle,
    alt: 'المتحمس',
    width: 900,
    height: 889,
  },
  innocent_default_idle: {
    src: innocentDefaultIdle,
    alt: 'البريء المشبوه',
    width: 564,
    height: 900,
  },
  detective_default_idle: {
    src: detectiveDefaultIdle,
    alt: 'المحقق',
    width: 320,
    height: 900,
  },

  // Saudi costume variants. Same characters — see ART_BIBLE.md §14.
  detective_saudi_idle: {
    src: detectiveSaudiIdle,
    alt: 'المحقق بالغترة',
    width: 380,
    height: 900,
  },
  innocent_hijab_idle: {
    src: innocentHijabIdle,
    alt: 'البريء المشبوه بالحجاب',
    width: 604,
    height: 900,
  },
};

export function getAsset(id: AssetId): AssetEntry | undefined {
  return assetRegistry[id];
}

/**
 * Build an asset id, falling back to the `default` variant when a costume has
 * no art for the requested pose yet.
 *
 * This is what keeps variants cheap: a room can put the detective in a ghutra
 * without every one of his poses having to exist in that costume on day one.
 */
export function characterAsset(
  characterId: string,
  pose: string,
  variant = 'default',
): AssetId {
  const requested = `${characterId}_${variant}_${pose}`;
  if (assetRegistry[requested]) return requested;

  const fallback = `${characterId}_default_${pose}`;
  if (assetRegistry[fallback]) return fallback;

  // Neither exists — return the requested id so <AssetSlot /> names the exact
  // asset that still needs generating.
  return requested;
}
