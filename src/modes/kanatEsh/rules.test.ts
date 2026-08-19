import { describe, expect, it } from 'vitest';
import { kanatEshMachine } from './machine';
import {
  KANAT_ESH,
  SEED_SENTENCES,
  canReadLink,
  chainAssignments,
  chainAssignmentsDuo,
  chainLength,
  currentAuthorId,
  currentLinkType,
  duoLinksPerTrack,
  isChainComplete,
  isMyTurn,
  linkTypeAt,
  pickSeed,
  pickTwoDistinctSeeds,
  readableLinkIndex,
  scoreKanatEshRound,
  type KanatEshState,
} from './rules';

function state(overrides: Partial<KanatEshState> = {}): KanatEshState {
  return {
    phase: 'turn',
    authorByIndex: { 1: 'p1', 2: 'p2', 3: 'p3', 4: 'p1' },
    currentIndex: 2,
    totalLinks: 5,
    ...overrides,
  };
}

describe('kanatEsh machine', () => {
  it('is well-formed', () => {
    expect(() => kanatEshMachine.validate()).not.toThrow();
  });

  it('loops turns and only then reveals', () => {
    expect(kanatEshMachine.canTransition('turn', 'turn')).toBe(true);
    expect(kanatEshMachine.canTransition('turn', 'reveal')).toBe(true);
  });

  it('has no per-turn reveal, which would leak the chain', () => {
    expect(kanatEshMachine.canTransition('setup', 'reveal')).toBe(false);
  });
});

describe('chain shape', () => {
  it('alternates text and drawing, starting from the seed sentence', () => {
    expect(linkTypeAt(0)).toBe('text');
    expect(linkTypeAt(1)).toBe('drawing');
    expect(linkTypeAt(2)).toBe('text');
    expect(linkTypeAt(3)).toBe('drawing');
  });

  it('gives one link per player, clamped for pacing', () => {
    expect(chainLength(5)).toBe(5);
    expect(chainLength(2)).toBe(KANAT_ESH.minLinks);
    expect(chainLength(50)).toBe(KANAT_ESH.maxLinks);
  });

  it('never gives consecutive links to the same player', () => {
    // Reading your own drawing back would make the round trivially accurate.
    const authors = chainAssignments(['p1', 'p2', 'p3', 'p4'], 6);
    for (let i = 1; i < authors.length; i += 1) {
      expect(authors[i]).not.toBe(authors[i - 1]);
    }
  });

  it('refuses a room too small to rotate', () => {
    expect(() => chainAssignments(['p1', 'p2'], 4)).toThrowError();
  });
});

describe('Duo — two independent chains', () => {
  it('pickTwoDistinctSeeds never gives both tracks the same sentence', () => {
    // A fake random that would otherwise return the same seed both times.
    const [a, b] = pickTwoDistinctSeeds([], () => 0);
    expect(a).not.toBe(b);
  });

  it('duoLinksPerTrack is the seed plus one drawing+text pair per repeat', () => {
    expect(duoLinksPerTrack()).toBe(1 + KANAT_ESH.duo.repeats * 2);
  });

  it('chainAssignmentsDuo: the owner draws their own word first', () => {
    const links = duoLinksPerTrack();
    const authors = chainAssignmentsDuo('owner', 'other', links);
    expect(authors[0]).toBe('owner');
    expect(authors[1]).toBe('other');
  });

  it('chainAssignmentsDuo: strictly alternates for the whole track', () => {
    const links = duoLinksPerTrack();
    const authors = chainAssignmentsDuo('p1', 'p2', links);
    for (let i = 1; i < authors.length; i += 1) {
      expect(authors[i]).not.toBe(authors[i - 1]);
    }
  });

  it('chainAssignmentsDuo: never throws at two players, unlike the group version', () => {
    expect(() => chainAssignmentsDuo('p1', 'p2', duoLinksPerTrack())).not.toThrow();
  });

  it('a player on one track cannot read the other track\'s current link', () => {
    // Modelled directly on the blindness rule below, just doubled: each
    // track's state is fully independent, so "my turn on track 0" carries no
    // visibility into track 1 at all — canReadLink only ever sees one
    // track's state at a time by construction.
    const trackA = state({ authorByIndex: { 1: 'p1', 2: 'p2' }, currentIndex: 1 });
    const trackB = state({ authorByIndex: { 1: 'p2', 2: 'p1' }, currentIndex: 1 });
    // p1's turn on track A (index 2) does not grant them track B's index 1,
    // because that check is against trackB's OWN state, where it is p2's turn.
    expect(isMyTurn(trackA, 'p1')).toBe(true);
    expect(isMyTurn(trackB, 'p1')).toBe(false);
    expect(canReadLink(trackB, 'p1', 0)).toBe(false);
  });
});

describe('blindness — the core rule', () => {
  it('lets a player read exactly the link that feeds their turn', () => {
    expect(readableLinkIndex(2)).toBe(1);
    expect(canReadLink(state(), 'p2', 1)).toBe(true);
  });

  it('refuses every other link, including the original sentence', () => {
    const s = state();
    // Seeing the seed would let a player reason backwards and kill the drift.
    expect(canReadLink(s, 'p2', 0)).toBe(false);
    expect(canReadLink(s, 'p2', 2)).toBe(false);
    expect(canReadLink(s, 'p2', 3)).toBe(false);
  });

  it('refuses players whose turn it is not', () => {
    expect(canReadLink(state(), 'p3', 1)).toBe(false);
  });

  it('opens everything only at the reveal', () => {
    const revealed = state({ phase: 'reveal' });
    for (const index of [0, 1, 2, 3, 4]) {
      expect(canReadLink(revealed, 'p3', index)).toBe(true);
    }
  });
});

describe('turn tracking', () => {
  it('knows whose turn it is and what kind of turn it is', () => {
    expect(currentAuthorId(state())).toBe('p2');
    expect(isMyTurn(state(), 'p2')).toBe(true);
    expect(isMyTurn(state(), 'p1')).toBe(false);
    expect(currentLinkType(state())).toBe('text');
  });

  it('detects a full chain', () => {
    expect(isChainComplete(state({ currentIndex: 5 }))).toBe(true);
    expect(isChainComplete(state({ currentIndex: 4 }))).toBe(false);
  });
});

describe('scoreKanatEshRound', () => {
  const authorByIndex = { 1: 'p1', 2: 'p2', 3: 'p3' };
  const playerIds = ['p1', 'p2', 'p3'];

  it('gives everyone something for finishing the chain', () => {
    const delta = scoreKanatEshRound({ authorByIndex, faithfulIndices: [], playerIds });
    for (const id of playerIds) {
      expect(delta[id]).toBe(KANAT_ESH.scores.completedChain);
    }
  });

  it('rewards both sides of a faithful hand-off', () => {
    // A link surviving takes two people doing their job: the one who made it
    // clear and the one who read it correctly.
    const delta = scoreKanatEshRound({ authorByIndex, faithfulIndices: [1], playerIds });
    const base = KANAT_ESH.scores.completedChain;
    expect(delta.p1).toBe(base + KANAT_ESH.scores.faithfulLink);
    expect(delta.p2).toBe(base + KANAT_ESH.scores.faithfulLink);
    expect(delta.p3).toBe(base);
  });

  it('stays gentle, so players are not pushed toward safe literal drawings', () => {
    // Heavily rewarding accuracy would make a broken-telephone round boring.
    expect(KANAT_ESH.scores.faithfulLink).toBeLessThanOrEqual(3);
  });
});

describe('seed sentences', () => {
  it('has no duplicates', () => {
    expect(new Set(SEED_SENTENCES).size).toBe(SEED_SENTENCES.length);
  });

  it('avoids seeds the room already used', () => {
    const used = SEED_SENTENCES.slice(0, SEED_SENTENCES.length - 1);
    expect(pickSeed(used, () => 0)).toBe(SEED_SENTENCES[SEED_SENTENCES.length - 1]);
  });
});
