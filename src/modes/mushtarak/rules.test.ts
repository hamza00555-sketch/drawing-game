import { describe, expect, it } from 'vitest';
import { mushtarakMachine } from './machine';
import {
  COMBO_PROMPTS,
  MUSHTARAK,
  canDraw,
  canGuess,
  canSendGotYou,
  pickArtistPair,
  pickCombo,
  scoreMushtarakRound,
  visiblePromptPart,
  type MushtarakState,
} from './rules';

function state(overrides: Partial<MushtarakState> = {}): MushtarakState {
  return {
    phase: 'draw',
    artistIds: ['a1', 'a2'],
    guesserIds: ['g1', 'g2'],
    ...overrides,
  };
}

const parts = { partA: 'ديناصور', partB: 'يلبس فستان عرس', full: 'ديناصور يلبس فستان عرس' };

describe('mushtarak machine', () => {
  it('is well-formed', () => {
    expect(() => mushtarakMachine.validate()).not.toThrow();
  });

  it('guesses only after both halves are finished', () => {
    // Unlike الممنوعات, the picture makes no sense until both artists are done,
    // so guessing is its own phase rather than running alongside drawing.
    expect(mushtarakMachine.canTransition('draw', 'guess')).toBe(true);
    expect(mushtarakMachine.canTransition('brief', 'guess')).toBe(false);
  });
});

describe('simultaneous drawing', () => {
  it('lets BOTH artists draw at the same time', () => {
    expect(canDraw(state(), 'a1')).toBe(true);
    expect(canDraw(state(), 'a2')).toBe(true);
  });

  it('never lets a guesser draw', () => {
    expect(canDraw(state(), 'g1')).toBe(false);
  });

  it('never lets an artist guess their own drawing', () => {
    expect(canGuess(state({ phase: 'guess' }), 'a1')).toBe(false);
    expect(canGuess(state({ phase: 'guess' }), 'g1')).toBe(true);
  });
});

describe('split prompt', () => {
  it('shows each artist only their own half', () => {
    expect(visiblePromptPart(state(), 'a1', parts)).toBe(parts.partA);
    expect(visiblePromptPart(state(), 'a2', parts)).toBe(parts.partB);
  });

  it('shows guessers nothing at all while drawing', () => {
    expect(visiblePromptPart(state(), 'g1', parts)).toBeUndefined();
  });

  it('reveals the whole prompt to everyone at the reveal', () => {
    const revealed = state({ phase: 'reveal' });
    expect(visiblePromptPart(revealed, 'a1', parts)).toBe(parts.full);
    expect(visiblePromptPart(revealed, 'g1', parts)).toBe(parts.full);
  });
});

describe('فهمتك signal', () => {
  it('allows one use per artist per round', () => {
    expect(canSendGotYou(state(), 'a1', [], 1)).toBe(true);
    expect(canSendGotYou(state(), 'a1', ['a1'], 1)).toBe(false);
  });

  it('does not spend one artist’s use on the other', () => {
    expect(canSendGotYou(state(), 'a2', ['a1'], 1)).toBe(true);
  });

  it('is unavailable to guessers and outside the drawing phase', () => {
    expect(canSendGotYou(state(), 'g1', [], 1)).toBe(false);
    expect(canSendGotYou(state({ phase: 'guess' }), 'a1', [], 1)).toBe(false);
  });
});

describe('pickArtistPair', () => {
  it('picks two distinct artists and leaves the rest guessing', () => {
    const { artistIds, guesserIds } = pickArtistPair(['p1', 'p2', 'p3', 'p4'], [], () => 0);
    expect(new Set(artistIds).size).toBe(2);
    expect(guesserIds).not.toContain(artistIds[0]);
    expect(guesserIds).not.toContain(artistIds[1]);
    expect(artistIds.length + guesserIds.length).toBe(4);
  });

  it('rotates away from whoever drew last', () => {
    const { artistIds } = pickArtistPair(['p1', 'p2', 'p3', 'p4'], ['p1', 'p2'], () => 0);
    expect(artistIds).not.toContain('p1');
    expect(artistIds).not.toContain('p2');
  });

  it('falls back to the whole room once everyone has drawn', () => {
    const { artistIds } = pickArtistPair(['p1', 'p2', 'p3'], ['p1', 'p2', 'p3'], () => 0);
    expect(new Set(artistIds).size).toBe(2);
  });

  it('refuses a room with no one left to guess', () => {
    expect(() => pickArtistPair(['p1', 'p2'])).toThrowError();
  });
});

describe('scoreMushtarakRound', () => {
  it('pays both artists together when the combination is named', () => {
    // Neither drew the whole idea, so paying them individually would
    // misrepresent what happened.
    const delta = scoreMushtarakRound({
      artistIds: ['a1', 'a2'],
      correctGuesserIds: ['g1'],
    });

    expect(delta.a1).toBe(MUSHTARAK.scores.artistsOnSuccess);
    expect(delta.a2).toBe(MUSHTARAK.scores.artistsOnSuccess);
    expect(delta.g1).toBe(MUSHTARAK.scores.guesserCorrect);
  });

  it('pays the artists nothing when nobody got it', () => {
    const delta = scoreMushtarakRound({ artistIds: ['a1', 'a2'], correctGuesserIds: [] });
    expect(delta.a1).toBeUndefined();
    expect(delta.a2).toBeUndefined();
  });
});

describe('combo prompt bank', () => {
  it('always has two halves that combine into the full phrase', () => {
    for (const entry of COMBO_PROMPTS) {
      expect(entry.partA.length).toBeGreaterThan(0);
      expect(entry.partB.length).toBeGreaterThan(0);
      expect(entry.full).toContain(entry.partA);
    }
  });

  it('has no duplicates', () => {
    const all = COMBO_PROMPTS.map((c) => c.full);
    expect(new Set(all).size).toBe(all.length);
  });

  it('avoids prompts the room already used', () => {
    const used = COMBO_PROMPTS.slice(0, COMBO_PROMPTS.length - 1).map((c) => c.full);
    expect(pickCombo(used, () => 0).full).toBe(COMBO_PROMPTS[COMBO_PROMPTS.length - 1]?.full);
  });
});
