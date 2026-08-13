/**
 * Character reservation.
 *
 * Each character may be held by at most one player in a room. That has to be
 * true at the database level, not just in the UI: two players tapping the same
 * character in the same instant is a completely ordinary thing to happen when
 * five people open a lobby at once, and a UI-only check loses that race.
 *
 * The reservation lives at `roomCharacters/{roomId}/{characterId}` and is
 * claimed with a transaction. The security rule permits a write only when the
 * node is empty or already yours, so even a malicious client cannot steal a
 * held character. `roomPlayers/{uid}/characterId` is additionally validated
 * against this index, so a player cannot appear as a character they never
 * reserved.
 */

import { get, onValue, ref, runTransaction, remove } from 'firebase/database';
import { getDb } from './firebase';
import { paths } from './paths';

export class CharacterTakenError extends Error {
  readonly characterId: string;

  constructor(characterId: string) {
    super('أحد أخذ هذي الشخصية قبلك. اختر غيرها.');
    this.name = 'CharacterTakenError';
    this.characterId = characterId;
  }
}

/**
 * Attempt to reserve a character.
 *
 * Returns normally on success and throws `CharacterTakenError` when another
 * player got there first. Re-claiming a character you already hold succeeds,
 * so a reconnect or a double tap is harmless.
 */
export async function claimCharacter(
  roomId: string,
  playerId: string,
  characterId: string,
): Promise<void> {
  const characterRef = ref(getDb(), paths.character(roomId, characterId));

  const result = await runTransaction(characterRef, (current: string | null) => {
    if (current === null || current === playerId) return playerId;
    // Returning undefined aborts the transaction without writing.
    return undefined;
  });

  if (!result.committed || result.snapshot.val() !== playerId) {
    throw new CharacterTakenError(characterId);
  }
}

/** Release a character this player holds. A no-op if they do not hold it. */
export async function releaseCharacter(
  roomId: string,
  playerId: string,
  characterId: string,
): Promise<void> {
  const characterRef = ref(getDb(), paths.character(roomId, characterId));
  const snapshot = await get(characterRef);

  if (snapshot.val() === playerId) {
    await remove(characterRef);
  }
}

/**
 * Switch characters atomically from the player's point of view: the new one is
 * claimed first, and the old one is only released once that succeeded. Doing it
 * the other way round would briefly free the player's current character, letting
 * someone else take it while their own switch is failing.
 */
export async function switchCharacter(
  roomId: string,
  playerId: string,
  fromCharacterId: string | undefined,
  toCharacterId: string,
): Promise<void> {
  if (fromCharacterId === toCharacterId) return;

  await claimCharacter(roomId, playerId, toCharacterId);

  if (fromCharacterId) {
    await releaseCharacter(roomId, playerId, fromCharacterId);
  }
}

/** Release every character held by this player. Used on leave. */
export async function releaseAllForPlayer(
  roomId: string,
  playerId: string,
): Promise<void> {
  const snapshot = await get(ref(getDb(), paths.characters(roomId)));
  const held = (snapshot.val() as Record<string, string> | null) ?? {};

  await Promise.all(
    Object.entries(held)
      .filter(([, holder]) => holder === playerId)
      .map(([characterId]) => releaseCharacter(roomId, playerId, characterId)),
  );
}

/** Live map of characterId -> playerId holding it. */
export function watchCharacters(
  roomId: string,
  onChange: (taken: Record<string, string>) => void,
): () => void {
  return onValue(ref(getDb(), paths.characters(roomId)), (snapshot) => {
    onChange((snapshot.val() as Record<string, string> | null) ?? {});
  });
}

/** Character ids held by someone other than this player. */
export function takenByOthers(
  taken: Record<string, string>,
  selfId: string | undefined,
): string[] {
  return Object.entries(taken)
    .filter(([, holder]) => holder !== selfId)
    .map(([characterId]) => characterId);
}
