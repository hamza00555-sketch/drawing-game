/**
 * The وش ذا؟ cast.
 *
 * Players pick one of these as their avatar when they join a room. Each is a
 * distinct silhouette, not a recoloured copy — see ART_BIBLE.md §12 and the
 * silhouette acceptance test.
 *
 * `penColor` is the colour this character's strokes take on a shared canvas.
 * Two players in الرسم المشترك must stay tellable apart at a glance, so the
 * colours are assigned per character rather than by seat order.
 */

export interface GameCharacter {
  id: string;
  /** Arabic display name, shown in the lobby and on results. */
  name: string;
  /** One-line personality, used in the character picker. */
  blurb: string;
  /** Asset id of the neutral pose. Expression variants suffix the state. */
  idleAsset: string;
  penColor: string;
}

export const CHARACTERS: readonly GameCharacter[] = [
  {
    id: 'artist',
    name: 'الفنان المتفلسف',
    blurb: 'واثق من عبقريته حتى لو كانت رسمته كارثة',
    idleAsset: 'char_artist_idle',
    penColor: 'var(--wt-tomato)',
  },
  {
    id: 'detective',
    name: 'المحقق',
    blurb: 'يشك في الجميع، وأحيانًا في نفسه',
    idleAsset: 'char_detective_idle',
    penColor: 'var(--wt-mustard)',
  },
  {
    id: 'confused',
    name: 'الملخبط',
    blurb: 'ما فهم شيء، ومستمر',
    idleAsset: 'char_confused_idle',
    penColor: 'var(--wt-teal)',
  },
  {
    id: 'excited',
    name: 'المتحمس',
    blurb: 'طاقته أكبر من اللعبة نفسها',
    idleAsset: 'char_excited_idle',
    penColor: 'var(--wt-cobalt)',
  },
  {
    id: 'innocent',
    name: 'البريء المشبوه',
    blurb: 'وجهه بريء أكثر من اللازم',
    idleAsset: 'char_innocent_idle',
    penColor: 'var(--wt-rose)',
  },
  {
    id: 'critic',
    name: 'الناقد',
    blurb: 'يتعامل مع كل خربشة كأنها معرض عالمي',
    idleAsset: 'char_critic_idle',
    penColor: 'var(--wt-grape)',
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
