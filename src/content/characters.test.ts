import { describe, expect, it } from 'vitest';
import {
  CHARACTERS,
  availableCharacters,
  getCharacter,
  mainCastCharacters,
} from './characters';
import { ROOM } from '../config/balance';
import { getAsset } from '../assets/registry';

describe('cast size', () => {
  it('has one character per possible player, so a full room can all differ', () => {
    expect(CHARACTERS).toHaveLength(ROOM.maxPlayers);
  });

  it('has unique ids', () => {
    const ids = CHARACTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('main cast', () => {
  it('is the six originals — the faces of the game', () => {
    expect(mainCastCharacters().map((c) => c.id)).toEqual([
      'artist',
      'critic',
      'confused',
      'excited',
      'innocent',
      'detective',
    ]);
  });

  it('is a strict subset: the added four are playable but not identity art', () => {
    const main = mainCastCharacters();
    expect(main.length).toBeLessThan(CHARACTERS.length);
    expect(CHARACTERS.filter((c) => !c.mainCast)).toHaveLength(4);
  });

  it('carries every Saudi variant, so representation sits in the identity cast', () => {
    const withVariants = CHARACTERS.filter((c) => c.variants.length > 1);
    expect(withVariants.length).toBeGreaterThan(0);
    for (const character of withVariants) {
      expect(character.mainCast, `${character.id} should be main cast`).toBe(true);
    }
  });
});

describe('pen colours', () => {
  it('are distinct across all ten, so co-drawn strokes stay attributable', () => {
    const colors = CHARACTERS.map((c) => c.penColor);
    expect(new Set(colors).size).toBe(colors.length);
  });
});

describe('art coverage', () => {
  it('every character has registered idle art for each declared variant', () => {
    for (const character of CHARACTERS) {
      for (const variant of character.variants) {
        const id = `${character.id}_${variant.id}_idle`;
        expect(getAsset(id), `missing art: ${id}`).toBeDefined();
      }
    }
  });
});

describe('availableCharacters', () => {
  it('removes the ones already reserved', () => {
    const available = availableCharacters(['artist', 'calm']);
    expect(available).toHaveLength(CHARACTERS.length - 2);
    expect(available.map((c) => c.id)).not.toContain('artist');
    expect(available.map((c) => c.id)).not.toContain('calm');
  });

  it('returns nothing when a full room has claimed everything', () => {
    expect(availableCharacters(CHARACTERS.map((c) => c.id))).toHaveLength(0);
  });
});

describe('getCharacter', () => {
  it('resolves the new player-only cast too', () => {
    for (const id of ['confident', 'dramatic', 'calm', 'trickster']) {
      expect(getCharacter(id)?.mainCast).toBe(false);
    }
  });
});
