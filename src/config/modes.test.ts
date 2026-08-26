import { describe, expect, it } from 'vitest';
import { HIDDEN_MODES, isModeAvailable } from './modes';
import { MODE_TUNABLES } from '../../shared/tunables';
import type { GameMode } from '../engine/room';

const ALL_MODES = Object.keys(MODE_TUNABLES) as GameMode[];

describe('mode rotation', () => {
  it('only hides modes that actually exist', () => {
    // A typo here would silently hide nothing, and the mode would stay live.
    for (const mode of HIDDEN_MODES) {
      expect(ALL_MODES).toContain(mode);
    }
  });

  it('leaves something to play', () => {
    const available = ALL_MODES.filter((mode) => isModeAvailable(mode));
    expect(available.length).toBeGreaterThan(0);
    // The two that carry the game while the other three are out.
    expect(available).toContain('mozawwer');
    expect(available).toContain('mamnou3at');
  });

  it('treats every hidden mode as unavailable, and the rest as available', () => {
    for (const mode of ALL_MODES) {
      expect(isModeAvailable(mode)).toBe(!HIDDEN_MODES.includes(mode));
    }
  });

  it('treats "no mode chosen" as unavailable', () => {
    // Callers hand it a room's stored currentMode, which may be missing.
    expect(isModeAvailable(undefined)).toBe(false);
  });
});
