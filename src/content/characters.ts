/**
 * The وش ذا؟ cast — CANON.
 *
 * TEN characters, so a full room of ten players can each be someone different.
 * But they are not equals in the product:
 *
 *   - `mainCast: true`  — the six original designs. These are the faces of the
 *     game: Home hero, splash, mode scenes, tutorials, empty states, reactions,
 *     share art, marketing. Anything representing وش ذا؟ itself draws from here.
 *   - `mainCast: false` — the four added purely to widen player choice. They are
 *     fully playable and appear wherever a player who picked them appears, but
 *     they do not join the identity artwork, and no existing scene is
 *     regenerated to include them.
 *
 * The flag exists so `mainCastCharacters()` can drive that split, instead of
 * six character ids being hardcoded across the hero, the scenes and the
 * marketing surfaces.
 *
 * These designs are final. Every new pose starts from the Master Style Anchor
 * plus that character's own reference, so head shape, proportions, eyes, brows,
 * mouth, special features, colour and silhouette all survive a change of pose
 * or costume. See ART_BIBLE.md §12–14.
 */

import { PEN_COLORS } from '../design/penColors';

export interface CharacterVariant {
  id: string;
  /** Arabic label for the costume, shown when a variant is selectable. */
  label: string;
}

export interface GameCharacter {
  id: string;
  /** Arabic display name, shown in the lobby and on results. */
  name: string;
  /**
   * Short label for the picker grid, where a tile is ~66px wide at 320px.
   * The full `name` is used in the lobby and results, where there is room.
   */
  shortName: string;
  /** One line, used in the picker. Kept short — the art does the work. */
  blurb: string;
  /**
   * How this character behaves. Keeps generated poses in character rather than
   * letting the cast decay into recoloured avatars.
   */
  personality: string;
  /** Whether this character represents the game itself. See the note above. */
  mainCast: boolean;
  /**
   * Stroke colour on a shared canvas, as literal hex. Never a CSS variable —
   * a canvas context cannot resolve one. See design/penColors.ts.
   */
  penColor: string;
  /** Costume variants. `default` always exists and is the canon design. */
  variants: readonly CharacterVariant[];
}

/**
 * Every character has exactly one costume, and it is a different garment for
 * each: a thobe, a ghutra, a hijab, but equally a nightcap, a fez, a beanie.
 * That is why the variant id is `costume` and not `saudi` — the slot holds
 * whatever accessory characterises this particular member of the cast, and
 * only some of them are Saudi dress. The label is per-character because
 * "بالغترة" is wrong for a character wearing a scarf.
 */
const costume = (label: string) =>
  [
    { id: 'default', label: 'الأساسي' },
    { id: 'costume', label },
  ] as const;

export const CHARACTERS: readonly GameCharacter[] = [
  // ---- Main cast: the faces of وش ذا؟ -------------------------------------
  {
    id: 'artist',
    name: 'الفنان المتفلسف',
    shortName: 'الفنان',
    blurb: 'واثق من عبقريته حتى لو كانت رسمته كارثة',
    personality:
      'Confident, self-important, treats his own catastrophic drawings as masterpieces. The beret is core to his identity and is never removed.',
    mainCast: true,
    penColor: PEN_COLORS.artist,
    variants: costume('بالثوب'),
  },
  {
    id: 'critic',
    name: 'الناقد',
    shortName: 'الناقد',
    blurb: 'ما عجبه شي، ولا مرة',
    personality:
      'Low energy, permanently unimpressed, sarcastic and judgmental. Expressions read as "I have seen better" even at good moments.',
    mainCast: true,
    penColor: PEN_COLORS.critic,
    variants: costume('بالوشاح'),
  },
  {
    id: 'confused',
    name: 'الملخبط',
    shortName: 'الملخبط',
    blurb: 'ما فهم شيء، ومستمر',
    personality:
      'Always visibly trying to work out what is happening. The go-to face for bewilderment, doubt and confusion.',
    mainCast: true,
    penColor: PEN_COLORS.confused,
    variants: costume('بالطاقية'),
  },
  {
    id: 'excited',
    name: 'المتحمس',
    shortName: 'المتحمس',
    blurb: 'طاقته أكبر من اللعبة نفسها',
    personality:
      'Enormous energy. Movement is fast, exaggerated and physical — jumping, flailing, never still. Poses should be mid-motion.',
    mainCast: true,
    penColor: PEN_COLORS.excited,
    variants: costume('بعصابة الرأس'),
  },
  {
    id: 'innocent',
    name: 'البريء المشبوه',
    shortName: 'البريء',
    blurb: 'وجهه بريء أكثر من اللازم',
    personality:
      'Sweet and guileless to a degree that becomes funny the moment suspicion or accusation is in the air.',
    mainCast: true,
    penColor: PEN_COLORS.innocent,
    variants: costume('بالحجاب'),
  },
  {
    id: 'detective',
    name: 'المحقق',
    shortName: 'المحقق',
    blurb: 'يشك في الجميع، وأحيانًا في نفسه',
    personality:
      'Cold, reserved, watches everyone with quiet suspicion. Especially suited to المزوّر.',
    mainCast: true,
    penColor: PEN_COLORS.detective,
    variants: costume('بالغترة'),
  },

  // ---- Player-only cast: widens choice, does not carry the identity --------
  {
    id: 'confident',
    name: 'الواثق زيادة',
    shortName: 'الواثق',
    blurb: 'متأكد إنه عارف، وهو غلطان',
    personality:
      'Absolutely certain he has the answer, and consistently wrong. Chest out, hands on hips, never doubts himself for a second.',
    mainCast: false,
    penColor: PEN_COLORS.confident,
    variants: costume('بالشماغ'),
  },
  {
    id: 'dramatic',
    name: 'الدرامي',
    shortName: 'الدرامي',
    blurb: 'كل شي عنده كارثة',
    personality:
      'Every minor event is an absolute catastrophe. Reactions are enormous and theatrical, arms flung wide, wailing at nothing.',
    mainCast: false,
    penColor: PEN_COLORS.dramatic,
    variants: costume('بالطربوش'),
  },
  {
    id: 'calm',
    name: 'الهادي',
    shortName: 'الهادي',
    blurb: 'الدنيا تنقلب وهو ساكت',
    personality:
      'Minimal reactions while everything around him is chaos. The comedy is the contrast — he barely moves.',
    mainCast: false,
    penColor: PEN_COLORS.calm,
    variants: costume('بطاقية النوم'),
  },
  {
    id: 'trickster',
    name: 'المشاغب',
    shortName: 'المشاغب',
    blurb: 'يستمتع بالخربطة أكثر من الفوز',
    personality:
      'Enjoys wrecking the situation far more than winning it. Lopsided, leaning, always hiding something behind his back.',
    mainCast: false,
    penColor: PEN_COLORS.trickster,
    variants: costume('بالبندانة'),
  },
] as const;

export function getCharacter(id: string): GameCharacter | undefined {
  return CHARACTERS.find((character) => character.id === id);
}

/**
 * The six that represent the game itself. Use this for hero art, mode scenes,
 * tutorials, empty states and anything outward-facing — never the full ten.
 */
export function mainCastCharacters(): GameCharacter[] {
  return CHARACTERS.filter((character) => character.mainCast);
}

/**
 * Characters still free to pick in a room. `takenIds` comes from the
 * reservation index, not from local UI state.
 */
export function availableCharacters(takenIds: readonly string[]): GameCharacter[] {
  const taken = new Set(takenIds);
  return CHARACTERS.filter((character) => !taken.has(character.id));
}

export function hasVariant(characterId: string, variantId: string): boolean {
  return getCharacter(characterId)?.variants.some((v) => v.id === variantId) ?? false;
}
