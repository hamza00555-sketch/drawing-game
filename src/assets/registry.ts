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
import confidentDefaultIdle from './generated/confident_default_idle.webp';
import dramaticDefaultIdle from './generated/dramatic_default_idle.webp';
import calmDefaultIdle from './generated/calm_default_idle.webp';
import tricksterDefaultIdle from './generated/trickster_default_idle.webp';
import detectiveSaudiIdle from './generated/detective_saudi_idle.webp';
import innocentHijabIdle from './generated/innocent_hijab_idle.webp';

import heroHome from './generated/hero_home_confused_group.webp';
import sceneMozawwer from './generated/mode_scene_mozawwer.webp';
import sceneKammil from './generated/mode_scene_kammil.webp';
import sceneMamnou3at from './generated/mode_scene_mamnou3at.webp';
import sceneMushtarak from './generated/mode_scene_mushtarak.webp';
import sceneKanatEsh from './generated/mode_scene_kanat_esh.webp';

import splashBackdrop from './generated/splash_backdrop.webp';
import revealRoleImpostor from './generated/reveal_role_impostor.webp';
import unmaskImpostor from './generated/unmask_impostor.webp';
import accusationGroup from './generated/accusation_group.webp';
import countdown3Surprised from './generated/countdown_3_surprised.webp';
import countdown2GrabsPen from './generated/countdown_2_grabs_pen.webp';
import countdown1Ready from './generated/countdown_1_ready.webp';

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

  // Player-only cast. Playable, but never used for identity artwork.
  confident_default_idle: {
    src: confidentDefaultIdle,
    alt: 'الواثق زيادة',
    width: 900,
    height: 859,
  },
  dramatic_default_idle: {
    src: dramaticDefaultIdle,
    alt: 'الدرامي',
    width: 673,
    height: 900,
  },
  calm_default_idle: {
    src: calmDefaultIdle,
    alt: 'الهادي',
    width: 900,
    height: 441,
  },
  trickster_default_idle: {
    src: tricksterDefaultIdle,
    alt: 'المشاغب',
    width: 625,
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
    width: 575,
    height: 900,
  },

  // Scenes. Each is a situation, not a portrait — see ART_BIBLE.md §18.
  hero_home_confused_group: {
    src: heroHome,
    alt: 'الشخصيات مجتمعة حول رسمة غريبة تحاول فهمها',
    width: 1400,
    height: 1000,
  },
  mode_scene_mozawwer: {
    src: sceneMozawwer,
    alt: 'مجموعة ترسم بثقة وواحد متوتر يحاول الاندماج',
    width: 700,
    height: 410,
  },
  mode_scene_kammil: {
    src: sceneKammil,
    alt: 'رسمة تُمرَّر بسرعة بين اللاعبين',
    width: 700,
    height: 279,
  },
  mode_scene_mamnou3at: {
    src: sceneMamnou3at,
    alt: 'شخصية تحاول الرسم وبعض العناصر ممنوعة عليها',
    width: 700,
    height: 511,
  },
  mode_scene_mushtarak: {
    src: sceneMushtarak,
    alt: 'شخصيتان ترسمان على نفس الورقة بأقلام مختلفة',
    width: 700,
    height: 419,
  },
  mode_scene_kanat_esh: {
    src: sceneKanatEsh,
    alt: 'رسمة تنتقل بين الشخصيات وتتغير تدريجيًا',
    width: 700,
    height: 328,
  },

  splash_backdrop: {
    src: splashBackdrop,
    alt: 'مجموعة من شخصيات اللعبة تتجمع وتحدّق بدهشة نحو رسمة غريبة',
    width: 1600,
    height: 1578,
  },
  reveal_role_impostor: {
    src: revealRoleImpostor,
    alt: 'قناع تنكري أسود مائل بعينين غير متماثلتين',
    width: 600,
    height: 446,
  },
  unmask_impostor: {
    src: unmaskImpostor,
    alt: 'القناع التنكري يطير بعيدًا وسط انفجار من الخطوط الدرامية',
    width: 700,
    height: 567,
  },
  accusation_group: {
    src: accusationGroup,
    alt: 'ثلاث شخصيات تشير بأصابعها بغضب نحو المزوّر المكشوف',
    width: 700,
    height: 528,
  },
  countdown_3_surprised: {
    src: countdown3Surprised,
    alt: 'شخصية صغيرة بعين واحدة تندهش وهي ترى الرسمة',
    width: 621,
    height: 700,
  },
  countdown_2_grabs_pen: {
    src: countdown2GrabsPen,
    alt: 'الشخصية نفسها تندفع لتمسك بالقلم',
    width: 634,
    height: 700,
  },
  countdown_1_ready: {
    src: countdown1Ready,
    alt: 'الشخصية نفسها تستعد للرسم ممسكة بالقلم بثبات',
    width: 640,
    height: 700,
  },
};

export function getAsset(id: AssetId): AssetEntry | undefined {
  return assetRegistry[id];
}

/**
 * Build an asset id, degrading gracefully when art does not exist yet.
 *
 * Resolution order:
 *   1. the exact costume + pose
 *   2. the default costume in that pose — so a costume never has to be
 *      generated in every pose before a room can use it
 *   3. (only when `fallbackToIdle`) the same character's idle pose
 *
 * Step 3 is opt-in because the two cases genuinely differ. A small avatar in a
 * list should keep working when a reaction pose has not been generated — a grid
 * of placeholder boxes where the players should be makes a core screen unusable.
 * A large, deliberate piece of art should NOT silently fall back: there the
 * placeholder is the point, naming exactly what still needs generating.
 */
export function characterAsset(
  characterId: string,
  pose: string,
  variant = 'default',
  fallbackToIdle = false,
): AssetId {
  const requested = `${characterId}_${variant}_${pose}`;
  if (assetRegistry[requested]) return requested;

  const defaultVariant = `${characterId}_default_${pose}`;
  if (assetRegistry[defaultVariant]) return defaultVariant;

  if (fallbackToIdle) {
    const idleInVariant = `${characterId}_${variant}_idle`;
    if (assetRegistry[idleInVariant]) return idleInVariant;

    const idleDefault = `${characterId}_default_idle`;
    if (assetRegistry[idleDefault]) return idleDefault;
  }

  // Nothing to show — return the requested id so <AssetSlot /> names the exact
  // asset that still needs generating.
  return requested;
}
