import { describe, expect, it } from 'vitest';
import { canEndDrawing, kammilDrawMs, KAMMIL, ROOM } from './balance';

describe('kammilDrawMs', () => {
  it('shortens the turn as more artists join', () => {
    expect(kammilDrawMs(2)).toBeGreaterThan(kammilDrawMs(3));
    expect(kammilDrawMs(3)).toBeGreaterThan(kammilDrawMs(4));
  });

  it('reuses the largest configured tier beyond the table', () => {
    expect(kammilDrawMs(9)).toBe(kammilDrawMs(5));
  });

  it('never returns less than the floor', () => {
    expect(kammilDrawMs(50)).toBeGreaterThanOrEqual(KAMMIL.drawMsFloor);
    expect(kammilDrawMs(0)).toBeGreaterThanOrEqual(KAMMIL.drawMsFloor);
  });
});

describe('canEndDrawing', () => {
  const base = {
    requesterId: 'p2',
    hostId: 'p1',
    readyPlayerIds: [] as string[],
    connectedPlayerCount: 4,
  };

  it('any_player lets anyone end the drawing', () => {
    expect(canEndDrawing({ ...base, rule: 'any_player' })).toBe(true);
  });

  it('host_only blocks non-hosts', () => {
    expect(canEndDrawing({ ...base, rule: 'host_only' })).toBe(false);
    expect(canEndDrawing({ ...base, rule: 'host_only', requesterId: 'p1' })).toBe(true);
  });

  describe('majority', () => {
    it('needs more than half, counting the requester', () => {
      // 1 of 4 -> not a majority.
      expect(canEndDrawing({ ...base, rule: 'majority' })).toBe(false);
      // 3 of 4 -> majority.
      expect(
        canEndDrawing({ ...base, rule: 'majority', readyPlayerIds: ['p3', 'p4'] }),
      ).toBe(true);
    });

    it('does not double-count a requester who already signalled ready', () => {
      // p2 requesting while already in the ready list is still only 2 of 4.
      expect(
        canEndDrawing({ ...base, rule: 'majority', readyPlayerIds: ['p2', 'p3'] }),
      ).toBe(false);
    });
  });
});

describe('room codes', () => {
  it('excludes glyphs that get misread when spoken across a table', () => {
    for (const char of ['0', 'O', '1', 'I', 'L']) {
      expect(ROOM.codeAlphabet).not.toContain(char);
    }
  });
});
