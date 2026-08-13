import { describe, expect, it } from 'vitest';
import { mozawwerMachine } from './machine';
import {
  canDraw,
  canEndDrawingNow,
  canOfferReady,
  currentPlayerId,
  isCorrectGuess,
  mustEndDrawing,
  nextTurn,
  normalizeGuess,
  tallyVotes,
  type MozawwerState,
} from './rules';

function state(overrides: Partial<MozawwerState> = {}): MozawwerState {
  return {
    phase: 'draw',
    turnOrder: ['p1', 'p2', 'p3'],
    turnIndex: 0,
    turnsTaken: 0,
    readyToVote: [],
    ...overrides,
  };
}

describe('mozawwer machine', () => {
  it('is well-formed: every phase reachable, every target real', () => {
    expect(() => mozawwerMachine.validate()).not.toThrow();
  });

  it('lets a caught impostor guess, and skips that when they survived', () => {
    expect(mozawwerMachine.canTransition('reveal', 'impostorGuess')).toBe(true);
    expect(mozawwerMachine.canTransition('reveal', 'result')).toBe(true);
  });

  it('does not allow skipping the vote', () => {
    expect(mozawwerMachine.canTransition('draw', 'reveal')).toBe(false);
    expect(mozawwerMachine.canTransition('draw', 'result')).toBe(false);
  });
});

describe('turn order', () => {
  it('wraps so the drawing can go round more than once', () => {
    let s = state();
    expect(currentPlayerId(s)).toBe('p1');

    s = nextTurn(nextTurn(nextTurn(s)));
    expect(currentPlayerId(s)).toBe('p1');
    expect(s.turnsTaken).toBe(3);
  });

  it('only the active player may draw', () => {
    const s = state();
    expect(canDraw(s, 'p1')).toBe(true);
    expect(canDraw(s, 'p2')).toBe(false);
  });

  it('nobody may draw outside the draw phase', () => {
    expect(canDraw(state({ phase: 'vote' }), 'p1')).toBe(false);
    expect(canDraw(state({ phase: 'roleReveal' }), 'p1')).toBe(false);
  });
});

describe('ending the drawing', () => {
  it('hides the ready button until the drawing has something in it', () => {
    // Otherwise a round could end before the impostor ever had to contribute.
    expect(canOfferReady(state({ turnsTaken: 0 }))).toBe(false);
    expect(canOfferReady(state({ turnsTaken: 2 }))).toBe(true);
  });

  it('respects the configured rule', () => {
    const s = state({ turnsTaken: 3 });
    const base = { state: s, hostId: 'p1', connectedPlayerCount: 3 };

    expect(canEndDrawingNow({ ...base, requesterId: 'p2', rule: 'any_player' })).toBe(true);
    expect(canEndDrawingNow({ ...base, requesterId: 'p2', rule: 'host_only' })).toBe(false);
    expect(canEndDrawingNow({ ...base, requesterId: 'p1', rule: 'host_only' })).toBe(true);
  });

  it('refuses even the host before the minimum turns', () => {
    expect(
      canEndDrawingNow({
        state: state({ turnsTaken: 0 }),
        requesterId: 'p1',
        hostId: 'p1',
        connectedPlayerCount: 3,
        rule: 'host_only',
      }),
    ).toBe(false);
  });

  it('force-ends at the turn ceiling so a room cannot stall forever', () => {
    expect(mustEndDrawing(state({ turnsTaken: 5 }))).toBe(false);
    expect(mustEndDrawing(state({ turnsTaken: 12 }))).toBe(true);
  });
});

describe('tallyVotes', () => {
  it('picks a clear leader', () => {
    const result = tallyVotes({ p1: 'p3', p2: 'p3', p4: 'p1' });
    expect(result.accusedId).toBe('p3');
    expect(result.tied).toBe(false);
  });

  it('accuses nobody on a tie', () => {
    // A tie means the room failed to agree, which counts as the impostor
    // surviving. Breaking the tie arbitrarily would punish someone the room
    // did not actually choose.
    const result = tallyVotes({ p1: 'p2', p2: 'p1' });
    expect(result.tied).toBe(true);
    expect(result.accusedId).toBeUndefined();
  });

  it('handles nobody voting', () => {
    const result = tallyVotes({});
    expect(result.accusedId).toBeUndefined();
    expect(result.tied).toBe(false);
  });
});

describe('normalizeGuess', () => {
  it('treats the hamza forms as the same letter', () => {
    expect(normalizeGuess('أسد')).toBe(normalizeGuess('اسد'));
    expect(normalizeGuess('إبريق')).toBe(normalizeGuess('ابريق'));
  });

  it('treats ة and ه as the same, which players type interchangeably', () => {
    expect(isCorrectGuess('قطه', 'قطة')).toBe(true);
  });

  it('ignores diacritics, tatweel and stray spacing', () => {
    expect(isCorrectGuess('  دَلّـة ', 'دلة')).toBe(true);
  });

  it('still rejects a genuinely different word', () => {
    expect(isCorrectGuess('قطة', 'كلب')).toBe(false);
  });
});
