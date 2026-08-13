/**
 * Presence and host migration.
 *
 * Two jobs:
 *   1. Keep `presence/{roomId}/{playerId}` truthful even when a phone dies
 *      mid-turn — handled by `onDisconnect`, which the Firebase servers run on
 *      our behalf once the socket drops.
 *   2. Make sure losing the host never ends the party.
 */

import {
  onDisconnect,
  onValue,
  ref,
  serverTimestamp,
  set,
  update,
  get,
} from 'firebase/database';
import { getDb } from './firebase';
import { paths } from './paths';

export interface PresenceRecord {
  connected: boolean;
  lastSeen: number;
}

export interface RoomPlayer {
  id: string;
  name: string;
  characterId: string;
  ready?: boolean;
  joinedAt: number;
}

/**
 * Begin publishing this player's presence.
 *
 * Ordering matters: the `onDisconnect` handler is registered BEFORE we mark
 * ourselves online. Registering it after would leave a window where a player
 * who drops mid-registration stays "connected" forever, and the room would wait
 * on a ghost.
 *
 * Returns a teardown function for a clean exit.
 */
export function startPresence(roomId: string, playerId: string): () => void {
  const db = getDb();
  const presenceRef = ref(db, paths.playerPresence(roomId, playerId));
  const connectedRef = ref(db, paths.infoConnected);

  const stop = onValue(connectedRef, async (snapshot) => {
    if (snapshot.val() !== true) return;

    // Firebase re-runs this on every reconnect, and an onDisconnect handler is
    // consumed once it fires, so it must be re-armed each time.
    await onDisconnect(presenceRef).update({
      connected: false,
      lastSeen: serverTimestamp(),
    });

    await set(presenceRef, {
      connected: true,
      lastSeen: serverTimestamp(),
    });
  });

  return () => {
    stop();
    void update(presenceRef, { connected: false, lastSeen: serverTimestamp() });
  };
}

export function watchPresence(
  roomId: string,
  onChange: (presence: Record<string, PresenceRecord>) => void,
): () => void {
  const presenceRef = ref(getDb(), paths.presence(roomId));
  return onValue(presenceRef, (snapshot) => {
    onChange((snapshot.val() as Record<string, PresenceRecord> | null) ?? {});
  });
}

/**
 * The player who should hold the host role: the earliest joiner who is still
 * connected. Every client computes this independently from the same data, so
 * they agree without needing to coordinate.
 */
export function pickHostSuccessor(
  players: Record<string, RoomPlayer>,
  presence: Record<string, PresenceRecord>,
): string | undefined {
  const connected = Object.values(players)
    .filter((player) => presence[player.id]?.connected === true)
    .sort((a, b) => a.joinedAt - b.joinedAt);

  return connected[0]?.id;
}

/**
 * Attempt to take over as host.
 *
 * Deliberately does NOT require a Cloud Function. The security rule permits
 * this write only while the current host is recorded as disconnected, so a
 * malicious client cannot steal the role from a live host. If several clients
 * race, they all nominate the same successor anyway; last-write-wins is safe
 * because every candidate was legitimate.
 *
 * Returns true when this client believes it is now the host.
 */
export async function claimHostIfVacant(
  roomId: string,
  selfId: string,
  players: Record<string, RoomPlayer>,
  presence: Record<string, PresenceRecord>,
): Promise<boolean> {
  const db = getDb();
  const hostRef = ref(db, paths.roomHostId(roomId));
  const snapshot = await get(hostRef);
  const currentHostId = snapshot.val() as string | null;

  if (!currentHostId) return false;
  if (currentHostId === selfId) return true;

  // Still alive — nothing to claim.
  if (presence[currentHostId]?.connected === true) return false;

  // Only the agreed successor attempts the write, to keep the race narrow.
  if (pickHostSuccessor(players, presence) !== selfId) return false;

  try {
    await set(hostRef, selfId);
    return true;
  } catch {
    // The rule rejected it — the host reconnected between our check and the
    // write. That is the rule doing its job, not an error worth surfacing.
    return false;
  }
}
