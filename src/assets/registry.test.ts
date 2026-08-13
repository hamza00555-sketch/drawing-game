import { describe, expect, it } from 'vitest';
import { characterAsset, getAsset } from './registry';

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

  it('defaults the variant when none is given', () => {
    expect(characterAsset('trickster', 'idle')).toBe('trickster_default_idle');
  });
});
