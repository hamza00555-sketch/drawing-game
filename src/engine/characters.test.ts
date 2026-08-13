import { describe, expect, it } from 'vitest';
import { takenByOthers } from './characters';

describe('takenByOthers', () => {
  const reservations = {
    artist: 'p1',
    detective: 'p2',
    calm: 'p3',
  };

  it('excludes the character this player holds, so their own stays selectable', () => {
    expect(takenByOthers(reservations, 'p2').sort()).toEqual(['artist', 'calm']);
  });

  it('reports everything as taken for a player holding nothing', () => {
    expect(takenByOthers(reservations, 'p9').sort()).toEqual([
      'artist',
      'calm',
      'detective',
    ]);
  });

  it('handles a player id that is not known yet', () => {
    expect(takenByOthers(reservations, undefined)).toHaveLength(3);
  });

  it('returns nothing for an empty room', () => {
    expect(takenByOthers({}, 'p1')).toEqual([]);
  });
});
