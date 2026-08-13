/**
 * Round secrets — the facts no client may ever hold.
 *
 * `games/{roomId}/current` is readable by every member of the room, because
 * phases, turn order and deadlines have to be. Read rules in Realtime Database
 * cascade downwards and cannot be revoked further down the tree, so anything
 * stored beside them is readable too: a `word` child on the game node would sit
 * in the impostor's DevTools no matter what rule was written beneath it.
 *
 * So the private half of a round lives here instead, under `gameSecrets`, which
 * is `.read: false` for everyone. Only the Admin SDK — which bypasses rules —
 * can see it. Each mode writes its own shape:
 *
 *   المزوّر        { word, impostorId }
 *   كمّل رسمتي     { word }
 *   الممنوعات      { word, forbidden }
 *   الرسم المشترك  { partA, partB, full }
 *   كانت إيش؟      { seed }
 *
 * When a round ends, whatever the room is now allowed to know is COPIED into
 * the public game node (`revealedWord`, `impostorId`, `full`, …). Revealing is
 * an explicit act, not the absence of one.
 */

import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export function gameSecretPath(roomId: string, gameId: string): string {
  return `gameSecrets/${roomId}/${gameId}`;
}

export async function readGameSecret<T>(roomId: string, gameId: string): Promise<T> {
  const snapshot = await admin.database().ref(gameSecretPath(roomId, gameId)).get();
  const value = snapshot.val() as T | null;

  if (!value) {
    throw new HttpsError('failed-precondition', 'ما لقينا بيانات الجولة.');
  }
  return value;
}
