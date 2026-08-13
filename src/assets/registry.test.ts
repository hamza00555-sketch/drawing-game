import { describe, expect, it } from 'vitest';
import { characterAsset, getAsset } from './registry';
import { CHARACTERS } from '../content/characters';

describe('characterAsset', () => {
  it('resolves a registered variant pose', () => {
    expect(characterAsset('detective', 'idle', 'saudi')).toBe('detective_saudi_idle');
  });

  it('falls back to the default variant when the costume lacks that pose', () => {
    // A costume must never have to be generated in every pose before a room can
    // use it: an unavailable costume pose shows the canon design instead of a
    // placeholder.
    expect(characterAsset('innocent', 'idle', 'no_such_costume')).toBe(
      'innocent_default_idle',
    );
  });

  it('names the exact requested asset when neither exists', () => {
    // Nothing to fall back to, so the placeholder should report what was asked
    // for — including the costume — rather than a misleading default.
    expect(characterAsset('detective', 'suspicious', 'saudi')).toBe(
      'detective_saudi_suspicious',
    );
    expect(getAsset('detective_saudi_suspicious')).toBeUndefined();
  });
});

describe('cast integrity', () => {
  it('every character has registered art for its declared variants', () => {
    for (const character of CHARACTERS) {
      for (const variant of character.variants) {
        const id = `${character.id}_${variant.id}_idle`;
        expect(getAsset(id), `missing art: ${id}`).toBeDefined();
      }
    }
  });

  it('every character has a distinct pen colour', () => {
    const colors = CHARACTERS.map((character) => character.penColor);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('always offers a default variant, since it is the canon design', () => {
    for (const character of CHARACTERS) {
      expect(character.variants.some((v) => v.id === 'default')).toBe(true);
    }
  });
});
