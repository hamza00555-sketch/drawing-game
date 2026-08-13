/**
 * The وش ذا؟ cast — CANON.
 *
 * These six designs are final. They are not reinterpreted per generation:
 * every new pose starts from the Master Style Anchor plus that character's own
 * reference image, so head shape, proportions, eyes, brows, mouth, special
 * features, colour and silhouette all survive a change of pose or costume.
 *
 * A player must recognise the character instantly even when the pose, the
 * expression, the clothing or the body angle changes. See ART_BIBLE.md §12–14.
 *
 * `penColor` is the colour this character's strokes take on a shared canvas.
 * Assigned per character, not by seat order, so two artists in الرسم المشترك
 * stay tellable apart at a glance.
 */

export interface CharacterVariant {
  id: string;
  /** Arabic label for the costume, shown when a variant is selectable. */
  label: string;
}

export interface GameCharacter {
  id: string;
  /** Arabic display name, shown in the lobby and on results. */
  name: string;
  /** One-line personality, used in the character picker. */
  blurb: string;
  /**
   * How this character behaves — the note that keeps generated poses in
   * character rather than turning the cast into recoloured avatars.
   */
  personality: string;
  penColor: string;
  /** Costume variants. `default` always exists and is the canon design. */
  variants: readonly CharacterVariant[];
}

export const CHARACTERS: readonly GameCharacter[] = [
  {
    id: 'artist',
    name: 'الفنان المتفلسف',
    blurb: 'واثق من عبقريته حتى لو كانت رسمته كارثة',
    personality:
      'Confident, self-important, treats his own catastrophic drawings as masterpieces. The beret is core to his identity and is never removed.',
    penColor: 'var(--wt-tomato)',
    variants: [{ id: 'default', label: 'الأساسي' }],
  },
  {
    id: 'critic',
    name: 'الناقد',
    blurb: 'ما عجبه شي، ولا مرة',
    personality:
      'Low energy, permanently unimpressed, sarcastic and judgmental. Expressions read as "I have seen better" even at good moments.',
    penColor: 'var(--wt-mustard)',
    variants: [{ id: 'default', label: 'الأساسي' }],
  },
  {
    id: 'confused',
    name: 'الملخبط',
    blurb: 'ما فهم شيء، ومستمر',
    personality:
      'Always visibly trying to work out what is happening. The go-to face for bewilderment, doubt and confusion.',
    penColor: 'var(--wt-teal)',
    variants: [{ id: 'default', label: 'الأساسي' }],
  },
  {
    id: 'excited',
    name: 'المتحمس',
    blurb: 'طاقته أكبر من اللعبة نفسها',
    personality:
      'Enormous energy. Movement is fast, exaggerated and physical — jumping, flailing, never still. Poses should be mid-motion.',
    penColor: 'var(--wt-cobalt)',
    variants: [{ id: 'default', label: 'الأساسي' }],
  },
  {
    id: 'innocent',
    name: 'البريء المشبوه',
    blurb: 'وجهه بريء أكثر من اللازم',
    personality:
      'Sweet and guileless to a degree that becomes funny the moment suspicion or accusation is in the air.',
    penColor: 'var(--wt-rose)',
    variants: [
      { id: 'default', label: 'الأساسي' },
      { id: 'hijab', label: 'بالحجاب' },
    ],
  },
  {
    id: 'detective',
    name: 'المحقق',
    blurb: 'يشك في الجميع، وأحيانًا في نفسه',
    personality:
      'Cold, reserved, watches everyone with quiet suspicion. Especially suited to المزوّر.',
    penColor: 'var(--wt-grape)',
    variants: [
      { id: 'default', label: 'الأساسي' },
      { id: 'saudi', label: 'بالغترة' },
    ],
  },
] as const;

export function getCharacter(id: string): GameCharacter | undefined {
  return CHARACTERS.find((character) => character.id === id);
}

/**
 * Characters still free to pick in a room. The cast size is the practical
 * player ceiling, which is why ROOM.maxPlayers matches it.
 */
export function availableCharacters(takenIds: readonly string[]): GameCharacter[] {
  const taken = new Set(takenIds);
  return CHARACTERS.filter((character) => !taken.has(character.id));
}

export function hasVariant(characterId: string, variantId: string): boolean {
  return getCharacter(characterId)?.variants.some((v) => v.id === variantId) ?? false;
}
