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
 */

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

/**
 * Populated as Higgsfield batches land. Deliberately empty at Phase 0 —
 * see ASSET_MANIFEST.md for what is queued and why.
 */
export const assetRegistry: Readonly<Record<AssetId, AssetEntry>> = {};

export function getAsset(id: AssetId): AssetEntry | undefined {
  return assetRegistry[id];
}
