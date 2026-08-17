/**
 * What every mode container needs, and the two hooks they all share.
 *
 * A container's whole job is translation: live Firebase state in, the props an
 * already-built screen expects out. It holds no game rules — those are in
 * `rules.ts` next to it and, for anything that decides an outcome, in
 * `functions/`. If a container starts deciding something, it is in the wrong
 * file.
 */

import { useEffect, useRef, useState } from 'react';
import { msUntil } from '../engine/clock';
import { watchMySecret, type GameState, type PlayerSecret } from '../engine/game';
import type { RoomPlayer } from '../engine/presence';

export interface LiveRoundProps {
  roomId: string;
  selfId: string;
  hostId: string;
  players: Record<string, RoomPlayer>;
  game: GameState;
  scores: Record<string, number>;
  /** Host-only: clear the finished round so the room can pick again. */
  onBackToLobby: () => void;
  /** Host-only: deal a fresh round of the same mode. */
  onNextRound: () => void;
  /** Host-only: clear the finished round and go straight to mode select. */
  onChangeMode: () => void;
}

/**
 * This player's private payload for the round.
 *
 * Returns `undefined` until it arrives, which screens must treat as "not yet",
 * never as "no word" — the difference between those two is the impostor.
 */
export function usePlayerSecret(
  roomId: string,
  gameId: string,
  playerId: string,
): PlayerSecret | undefined {
  const [secret, setSecret] = useState<PlayerSecret | undefined>(undefined);

  useEffect(() => {
    setSecret(undefined);
    return watchMySecret(roomId, gameId, playerId, setSecret);
  }, [roomId, gameId, playerId]);

  return secret;
}

/**
 * Run `action` once, when a server deadline passes.
 *
 * Phases end on the server's clock, but something has to tell the server that
 * the moment arrived. Whoever is responsible — the active player for their own
 * turn, the host for everyone else's — sets a single timer here.
 *
 * Two properties matter:
 *
 *   - **Server time, not device time.** `msUntil` corrects for a phone whose
 *     clock is minutes off, which in كمّل رسمتي is the difference between a
 *     three-second turn and a one-second one.
 *   - **Once per deadline.** The timer is keyed on the deadline itself, so a
 *     re-render cannot fire the same expiry twice, and the functions treat a
 *     duplicate as a no-op regardless.
 */
export function useDeadline(
  endsAt: number | null | undefined,
  enabled: boolean,
  action: () => void,
): void {
  const actionRef = useRef(action);
  actionRef.current = action;

  const firedFor = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled || typeof endsAt !== 'number') return;
    if (firedFor.current === endsAt) return;

    const timer = setTimeout(() => {
      firedFor.current = endsAt;
      actionRef.current();
    }, msUntil(endsAt));

    return () => clearTimeout(timer);
  }, [endsAt, enabled]);
}

/** Everyone still in the room, in join order. */
export function orderedPlayerIds(players: Record<string, RoomPlayer>): string[] {
  return Object.values(players)
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .map((player) => player.id);
}

export type { GameState, PlayerSecret };
