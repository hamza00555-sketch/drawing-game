/**
 * A fair rotation for "who gets the single special role this round" —
 * المزوّر's impostor, الممنوعات's artist, كمّل رسمتي's guesser.
 *
 * "Avoid only the immediate previous pick" — the rule each of those used
 * before this — allows a player to go a second or third time while someone
 * else in the room never gets picked at all over a long session. This
 * guarantees the opposite: shuffle the room once, hand out one player per
 * round in that fixed order, and only reshuffle once everyone has had a
 * turn. No one repeats before everyone else has gone once, and no one is
 * skipped indefinitely.
 *
 * Kept dependency-free like every other shared/*.ts file — compiled into
 * both the client bundle and the trusted server logic.
 */

import { shuffle } from './random.js';

export interface TurnCycleState {
  /** The current shuffled order. Exhausted once `position` reaches its end. */
  order: readonly string[];
  /** Index of the next player due for the role. */
  position: number;
}

/**
 * A fresh shuffled order. When `avoidFirst` is given and would otherwise
 * land first, it is swapped one place back — without this, the player who
 * just finished the previous cycle could be reshuffled straight back to the
 * front and get the role twice in a row across the seam between cycles.
 */
function freshOrder(
  playerIds: readonly string[],
  random: () => number,
  avoidFirst?: string,
): string[] {
  const order = shuffle(playerIds, random);
  if (avoidFirst && order.length > 1 && order[0] === avoidFirst) {
    [order[0], order[1]] = [order[1] as string, order[0] as string];
  }
  return order;
}

export function startTurnCycle(
  playerIds: readonly string[],
  random: () => number = Math.random,
): TurnCycleState {
  return { order: freshOrder(playerIds, random), position: 0 };
}

/**
 * Pick the next player and advance the cycle.
 *
 * If the stored cycle's roster no longer matches who is actually in the room
 * — someone joined or left since — it starts a fresh shuffle from position 0.
 * There is no way to "resume fairly" once the population itself changed, and
 * pretending otherwise would just hide a stale player in the order forever.
 */
export function nextInTurnCycle(
  state: TurnCycleState | undefined,
  playerIds: readonly string[],
  random: () => number = Math.random,
): { playerId: string; state: TurnCycleState } {
  const roster = [...playerIds];
  const sameRoster =
    state !== undefined &&
    state.position < state.order.length &&
    state.order.length === roster.length &&
    roster.every((id) => state.order.includes(id));

  const cycle = sameRoster ? (state as TurnCycleState) : { order: freshOrder(roster, random), position: 0 };
  const playerId = cycle.order[cycle.position] as string;
  const nextPosition = cycle.position + 1;

  const nextState: TurnCycleState =
    nextPosition >= cycle.order.length
      ? { order: freshOrder(roster, random, playerId), position: 0 }
      : { order: cycle.order, position: nextPosition };

  return { playerId, state: nextState };
}
