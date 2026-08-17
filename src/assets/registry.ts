/**
 * Asset registry — the single source of truth mapping an asset id to a file.
 *
 * ID SCHEME: `{character}_{variant}_{pose}`
 *
 *   artist_default_idle
 *   detective_costume_idle
 *   innocent_default_face
 *
 * The variant slot exists so a costume is a swap, never a second character.
 * A costumed detective is the SAME detective — see ART_BIBLE.md §14.
 * Non-character art keeps a descriptive id (`hero_home_confused_group`).
 *
 * Rules:
 *   - Every file lives in `src/assets/generated/`, and nothing here is edited
 *     by hand. Three kinds, by provenance:
 *       CHARACTERS — cut from the owner's own pose sheets in
 *       `art-reference/character-sheets/` by `scripts/cut-character-sheet.py`.
 *       SCENES — composed from those same cutouts plus generated props by
 *       `scripts/build-scene.py`, driven by `art-reference/scenes.json`. Not
 *       generated as pictures: a generated group shot would put the rejected
 *       cast back on the most visible screens.
 *       EVERYTHING ELSE — Higgsfield, following ART_BIBLE.md.
 *     Change any of them by re-running its script, not by touching the .webp.
 *   - Every entry must also exist in ASSET_MANIFEST.md with its prompt, or —
 *     for cut and composed art — its source and how it was built.
 *   - An id with no entry is not an error: <AssetSlot /> renders a neutral
 *     labelled placeholder so a screen can be built and reviewed before the
 *     artwork lands.
 *
 * Imports are static so Vite fingerprints and bundles them. Never build these
 * paths dynamically — a runtime string would silently ship a broken image.
 */

import artistDefaultIdle from './generated/artist_default_idle.webp';
import artistDefaultFace from './generated/artist_default_face.webp';
import artistDefaultAction from './generated/artist_default_action.webp';
import artistCostumeIdle from './generated/artist_costume_idle.webp';
import criticDefaultIdle from './generated/critic_default_idle.webp';
import criticDefaultFace from './generated/critic_default_face.webp';
import criticDefaultAction from './generated/critic_default_action.webp';
import criticCostumeIdle from './generated/critic_costume_idle.webp';
import confusedDefaultIdle from './generated/confused_default_idle.webp';
import confusedDefaultFace from './generated/confused_default_face.webp';
import confusedDefaultAction from './generated/confused_default_action.webp';
import confusedCostumeIdle from './generated/confused_costume_idle.webp';
import excitedDefaultIdle from './generated/excited_default_idle.webp';
import excitedDefaultFace from './generated/excited_default_face.webp';
import excitedDefaultAction from './generated/excited_default_action.webp';
import excitedCostumeIdle from './generated/excited_costume_idle.webp';
import innocentDefaultIdle from './generated/innocent_default_idle.webp';
import innocentDefaultFace from './generated/innocent_default_face.webp';
import innocentDefaultAction from './generated/innocent_default_action.webp';
import innocentCostumeIdle from './generated/innocent_costume_idle.webp';
import detectiveDefaultIdle from './generated/detective_default_idle.webp';
import detectiveDefaultFace from './generated/detective_default_face.webp';
import detectiveDefaultAction from './generated/detective_default_action.webp';
import detectiveCostumeIdle from './generated/detective_costume_idle.webp';
import confidentDefaultIdle from './generated/confident_default_idle.webp';
import confidentDefaultFace from './generated/confident_default_face.webp';
import confidentDefaultAction from './generated/confident_default_action.webp';
import confidentCostumeIdle from './generated/confident_costume_idle.webp';
import dramaticDefaultIdle from './generated/dramatic_default_idle.webp';
import dramaticDefaultFace from './generated/dramatic_default_face.webp';
import dramaticDefaultAction from './generated/dramatic_default_action.webp';
import dramaticCostumeIdle from './generated/dramatic_costume_idle.webp';
import calmDefaultIdle from './generated/calm_default_idle.webp';
import calmDefaultFace from './generated/calm_default_face.webp';
import calmDefaultAction from './generated/calm_default_action.webp';
import calmCostumeIdle from './generated/calm_costume_idle.webp';
import tricksterDefaultIdle from './generated/trickster_default_idle.webp';
import tricksterDefaultFace from './generated/trickster_default_face.webp';
import tricksterDefaultAction from './generated/trickster_default_action.webp';
import tricksterCostumeIdle from './generated/trickster_costume_idle.webp';

import heroHome from './generated/hero_home_confused_group.webp';
import sceneMozawwer from './generated/mode_scene_mozawwer.webp';
import sceneKammil from './generated/mode_scene_kammil.webp';
import sceneMamnou3at from './generated/mode_scene_mamnou3at.webp';
import sceneMushtarak from './generated/mode_scene_mushtarak.webp';
import sceneKanatEsh from './generated/mode_scene_kanat_esh.webp';

import logoWordmark from './generated/logo_wordmark.webp';
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
    width: 341,
    height: 900,
  },
  artist_default_face: {
    src: artistDefaultFace,
    alt: 'وجه الفنان المتفلسف',
    width: 420,
    height: 398,
  },
  artist_default_action: {
    src: artistDefaultAction,
    alt: 'الفنان المتفلسف متحرك',
    width: 506,
    height: 900,
  },
  artist_costume_idle: {
    src: artistCostumeIdle,
    alt: 'الفنان المتفلسف بالثوب',
    width: 349,
    height: 900,
  },
  critic_default_idle: {
    src: criticDefaultIdle,
    alt: 'الناقد',
    width: 686,
    height: 900,
  },
  critic_default_face: {
    src: criticDefaultFace,
    alt: 'وجه الناقد',
    width: 420,
    height: 386,
  },
  critic_default_action: {
    src: criticDefaultAction,
    alt: 'الناقد متحرك',
    width: 854,
    height: 900,
  },
  critic_costume_idle: {
    src: criticCostumeIdle,
    alt: 'الناقد بالوشاح',
    width: 680,
    height: 900,
  },
  confused_default_idle: {
    src: confusedDefaultIdle,
    alt: 'الملخبط',
    width: 518,
    height: 900,
  },
  confused_default_face: {
    src: confusedDefaultFace,
    alt: 'وجه الملخبط',
    width: 373,
    height: 420,
  },
  confused_default_action: {
    src: confusedDefaultAction,
    alt: 'الملخبط متحرك',
    width: 786,
    height: 900,
  },
  confused_costume_idle: {
    src: confusedCostumeIdle,
    alt: 'الملخبط بالطاقية',
    width: 534,
    height: 900,
  },
  excited_default_idle: {
    src: excitedDefaultIdle,
    alt: 'المتحمس',
    width: 663,
    height: 900,
  },
  excited_default_face: {
    src: excitedDefaultFace,
    alt: 'وجه المتحمس',
    width: 420,
    height: 405,
  },
  excited_default_action: {
    src: excitedDefaultAction,
    alt: 'المتحمس متحرك',
    width: 900,
    height: 751,
  },
  excited_costume_idle: {
    src: excitedCostumeIdle,
    alt: 'المتحمس بعصابة الرأس',
    width: 649,
    height: 900,
  },
  innocent_default_idle: {
    src: innocentDefaultIdle,
    alt: 'البريء المشبوه',
    width: 549,
    height: 900,
  },
  innocent_default_face: {
    src: innocentDefaultFace,
    alt: 'وجه البريء المشبوه',
    width: 420,
    height: 404,
  },
  innocent_default_action: {
    src: innocentDefaultAction,
    alt: 'البريء المشبوه متحرك',
    width: 788,
    height: 900,
  },
  innocent_costume_idle: {
    src: innocentCostumeIdle,
    alt: 'البريء المشبوه بالحجاب',
    width: 569,
    height: 900,
  },
  detective_default_idle: {
    src: detectiveDefaultIdle,
    alt: 'المحقق',
    width: 323,
    height: 900,
  },
  detective_default_face: {
    src: detectiveDefaultFace,
    alt: 'وجه المحقق',
    width: 343,
    height: 420,
  },
  detective_default_action: {
    src: detectiveDefaultAction,
    alt: 'المحقق متحرك',
    width: 342,
    height: 900,
  },
  detective_costume_idle: {
    src: detectiveCostumeIdle,
    alt: 'المحقق بالغترة',
    width: 427,
    height: 900,
  },

  // Player-only cast. Playable, but never used for identity artwork.
  confident_default_idle: {
    src: confidentDefaultIdle,
    alt: 'الواثق زيادة',
    width: 763,
    height: 900,
  },
  confident_default_face: {
    src: confidentDefaultFace,
    alt: 'وجه الواثق زيادة',
    width: 420,
    height: 333,
  },
  confident_default_action: {
    src: confidentDefaultAction,
    alt: 'الواثق زيادة متحرك',
    width: 692,
    height: 900,
  },
  confident_costume_idle: {
    src: confidentCostumeIdle,
    alt: 'الواثق زيادة بالشماغ',
    width: 786,
    height: 900,
  },
  dramatic_default_idle: {
    src: dramaticDefaultIdle,
    alt: 'الدرامي',
    width: 313,
    height: 900,
  },
  dramatic_default_face: {
    src: dramaticDefaultFace,
    alt: 'وجه الدرامي',
    width: 290,
    height: 420,
  },
  dramatic_default_action: {
    src: dramaticDefaultAction,
    alt: 'الدرامي متحرك',
    width: 475,
    height: 900,
  },
  dramatic_costume_idle: {
    src: dramaticCostumeIdle,
    alt: 'الدرامي بالطربوش',
    width: 596,
    height: 900,
  },
  calm_default_idle: {
    src: calmDefaultIdle,
    alt: 'الهادي',
    width: 900,
    height: 541,
  },
  calm_default_face: {
    src: calmDefaultFace,
    alt: 'وجه الهادي',
    width: 420,
    height: 361,
  },
  calm_default_action: {
    src: calmDefaultAction,
    alt: 'الهادي متحرك',
    width: 900,
    height: 478,
  },
  calm_costume_idle: {
    src: calmCostumeIdle,
    alt: 'الهادي بطاقية النوم',
    width: 900,
    height: 613,
  },
  trickster_default_idle: {
    src: tricksterDefaultIdle,
    alt: 'المشاغب',
    width: 479,
    height: 900,
  },
  trickster_default_face: {
    src: tricksterDefaultFace,
    alt: 'وجه المشاغب',
    width: 417,
    height: 420,
  },
  trickster_default_action: {
    src: tricksterDefaultAction,
    alt: 'المشاغب متحرك',
    width: 534,
    height: 900,
  },
  trickster_costume_idle: {
    src: tricksterCostumeIdle,
    alt: 'المشاغب بالبندانة',
    width: 519,
    height: 900,
  },

  // Scenes. Each is a situation, not a portrait — see ART_BIBLE.md §18.
  hero_home_confused_group: {
    src: heroHome,
    alt: 'الشخصيات مجتمعة حول رسمة غريبة تحاول فهمها',
    width: 1262,
    height: 698,
  },
  mode_scene_mozawwer: {
    src: sceneMozawwer,
    alt: 'مجموعة ترسم بثقة وواحد متوتر يحاول الاندماج',
    width: 1341,
    height: 658,
  },
  mode_scene_kammil: {
    src: sceneKammil,
    alt: 'رسمة تُمرَّر بسرعة بين اللاعبين',
    width: 1346,
    height: 624,
  },
  mode_scene_mamnou3at: {
    src: sceneMamnou3at,
    alt: 'شخصية تحاول الرسم وبعض العناصر ممنوعة عليها',
    width: 1049,
    height: 756,
  },
  mode_scene_mushtarak: {
    src: sceneMushtarak,
    alt: 'شخصيتان ترسمان على نفس الورقة بأقلام مختلفة',
    width: 1049,
    height: 739,
  },
  mode_scene_kanat_esh: {
    src: sceneKanatEsh,
    alt: 'رسمة تنتقل بين الشخصيات وتتغير تدريجيًا',
    width: 1333,
    height: 698,
  },

  /*
   * The wordmark. This is the ONE asset that legitimately carries text — the
   * game name is hand-lettered art, not type we could set (ART_BIBLE.md §19).
   * Everywhere else, Arabic copy is real text so it stays selectable,
   * translatable and readable by a screen reader.
   */
  logo_wordmark: {
    src: logoWordmark,
    alt: 'وش ذا؟ — لعبة الرسم والتخمين',
    width: 1198,
    height: 1200,
  },
  splash_backdrop: {
    src: splashBackdrop,
    alt: 'مجموعة من شخصيات اللعبة تتجمع وتحدّق بدهشة نحو رسمة غريبة',
    width: 1028,
    height: 972,
  },
  reveal_role_impostor: {
    src: revealRoleImpostor,
    alt: 'قناع تنكري أسود مائل بعينين غير متماثلتين',
    width: 951,
    height: 641,
  },
  unmask_impostor: {
    src: unmaskImpostor,
    alt: 'القناع التنكري يطير بعيدًا وسط انفجار من الخطوط الدرامية',
    width: 1113,
    height: 851,
  },
  accusation_group: {
    src: accusationGroup,
    alt: 'ثلاث شخصيات تشير بأصابعها بغضب نحو المزوّر المكشوف',
    width: 1086,
    height: 837,
  },
  countdown_3_surprised: {
    src: countdown3Surprised,
    alt: 'شخصية صغيرة بعين واحدة تندهش وهي ترى الرسمة',
    width: 1048,
    height: 645,
  },
  countdown_2_grabs_pen: {
    src: countdown2GrabsPen,
    alt: 'الشخصية نفسها تندفع لتمسك بالقلم',
    width: 1115,
    height: 630,
  },
  countdown_1_ready: {
    src: countdown1Ready,
    alt: 'الشخصية نفسها تستعد للرسم ممسكة بالقلم بثبات',
    width: 773,
    height: 713,
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
