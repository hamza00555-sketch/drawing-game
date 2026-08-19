/**
 * Presence and host hand-off.
 *
 * Two jobs:
 *   1. Keep `presence/{roomId}/{playerId}` truthful even when a phone dies
 *      mid-turn — handled by `onDisconnect`, which the Firebase servers run on
 *      our behalf once the socket drops.
 *   2. Let the room recover a missing host — on request, never automatically.
 *      See `takeHost` below.
 */

import { onDisconnect, onValue, ref, serverTimestamp, set, update } from 'firebase/database';
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
 * Take over as host, on request.
 *
 * Deliberately manual — there is no background effect that does this on its
 * own. A host who steps away is still the host when they come back; the room
 * waits, and whoever is left sees a "خذ الاستضافة" button instead of waking up
 * to find someone else silently in charge. Any connected player may press it,
 * not just whoever joined first — the security rule is the same either way,
 * since every connected member is a legitimate host.
 *
 * Deliberately does NOT require a Cloud Function: the security rule permits
 * this write only while the current host is recorded as disconnected, so a
 * malicious client cannot steal the role from a live host.
 *
 * Returns true when this client believes it is now the host.
 */
export async function takeHost(roomId: string, selfId: string): Promise<boolean> {
  try {
    await set(ref(getDb(), paths.roomHostId(roomId)), selfId);
    return true;
  } catch {
    // The rule rejected it — the host reconnected between the tap and the
    // write, or this device is not actually a connected member. Either way,
    // nothing here is worth surfacing as an error.
    return false;
  }
}
