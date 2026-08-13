import { describe, expect, it } from 'vitest';
import { DEFAULT_PEN, PEN_COLORS } from './penColors';
import { CHARACTERS } from '../content/characters';

describe('pen colours', () => {
  it('are literal hex, never CSS variables', () => {
    // A canvas 2D context cannot resolve var(--x). Assigning one is an invalid
    // strokeStyle, which the context silently ignores — so every player would
    // draw in whatever colour happened to be set last. This test is the guard.
    for (const [key, value] of Object.entries(PEN_COLORS)) {
      expect(value, key).toMatch(/^#[0-9a-f]{6}$/i);
    }
    expect(DEFAULT_PEN).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('is what every character actually uses', () => {
    const literals = new Set<string>(Object.values(PEN_COLORS));
    for (const character of CHARACTERS) {
      expect(character.penColor, character.id).toMatch(/^#[0-9a-f]{6}$/i);
      expect(literals.has(character.penColor), character.id).toBe(true);
    }
  });

  it('has one colour per character, all distinct', () => {
    const values = Object.values(PEN_COLORS);
    expect(new Set(values).size).toBe(values.length);
    expect(values).toHaveLength(CHARACTERS.length);
  });
});
