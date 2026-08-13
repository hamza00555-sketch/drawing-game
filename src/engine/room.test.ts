import { describe, expect, it } from 'vitest';
import { generateRoomCode, normalizeRoomCode } from './room';
import { ROOM } from '../config/balance';

describe('normalizeRoomCode', () => {
  it('accepts what a player actually types', () => {
    expect(normalizeRoomCode('  ab2k ')).toBe('AB2K');
    expect(normalizeRoomCode('a-b 2 k')).toBe('AB2K');
  });

  it('converts Arabic-Indic digits', () => {
    // An Arabic keyboard produces ٢ and ٤, but the code index is stored with
    // Latin digits. Without this the room simply "does not exist".
    expect(normalizeRoomCode('A٢B٤')).toBe('A2B4');
  });

  it('strips anything that is not a code character', () => {
    expect(normalizeRoomCode('A!B@2#K')).toBe('AB2K');
    expect(normalizeRoomCode('غرفة')).toBe('');
  });
});

describe('generateRoomCode', () => {
  it('produces the configured length', () => {
    expect(generateRoomCode()).toHaveLength(ROOM.codeLength);
  });

  it('only ever uses the safe alphabet', () => {
    for (let i = 0; i < 200; i += 1) {
      for (const char of generateRoomCode()) {
        expect(ROOM.codeAlphabet).toContain(char);
      }
    }
  });

  it('never emits glyphs that get misheard when read aloud', () => {
    const generated = Array.from({ length: 300 }, generateRoomCode).join('');
    for (const char of ['0', 'O', '1', 'I', 'L']) {
      expect(generated).not.toContain(char);
    }
  });

  it('is not obviously degenerate', () => {
    const codes = new Set(Array.from({ length: 200 }, generateRoomCode));
    expect(codes.size).toBeGreaterThan(150);
  });
});
