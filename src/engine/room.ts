/**
 * Room lifecycle: create, join, leave, observe.
 *
 * Rooms are addressed by a short spoken code, so the code index
 * (`roomCodes/{code} -> roomId`) exists to make joining a single direct read
 * instead of a scan over every room.
 */

import {
  get,
  onValue,
  ref,
  remove,
  runTransaction,
  serverTimestamp,
  set,
  update,
} from 'firebase/database';
import { ensureSignedIn, getDb } from './firebase';
import { serverNow } from './clock';
import { releaseAllForPlayer, switchCharacter } from './characters';
import { paths } from './paths';
import { ROOM } from '../config/balance';
import type { RoomPlayer } from './presence';

export type RoomStatus = 'lobby' | 'playing' | 'closed';
export type GameMode = 'mozawwer' | 'kammil' | 'mamnou3at' | 'mushtarak' | 'kanatEsh';

export interface Room {
  id: string;
  code: string;
  hostId: string;
  status: RoomStatus;
  currentMode?: GameMode;
  createdAt: number;
}

export class RoomError extends Error {
  readonly code: 'not_found' | 'full' | 'in_progress' | 'character_taken';

  constructor(code: RoomError['code'], message: string) {
    super(message);
    this.name = 'RoomError';
    this.code = code;
  }
}

/**
 * Codes avoid 0/O and 1/I/L: these rooms are joined by someone reading the code
 * out loud across a table, and those glyphs are the ones that get misheard.
 */
export function generateRoomCode(): string {
  const { codeAlphabet, codeLength } = ROOM;
  const random = new Uint32Array(codeLength);
  crypto.getRandomValues(random);

  let code = '';
  for (let i = 0; i < codeLength; i += 1) {
    code += codeAlphabet[(random[i] as number) % codeAlphabet.length];
  }
  return code;
}

/** Normalises whatever the player typed: case, spacing, Arabic-Indic digits. */
export function normalizeRoomCode(input: string): string {
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';

  return input
    .trim()
    .toUpperCase()
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
    .replace(/[^A-Z0-9]/g, '');
}

async function claimUnusedCode(roomId: string): Promise<string> {
  // A 4-character code over a 31-glyph alphabet is ~923k combinations, so a
  // collision is rare — but "rare" is not "never" once a room is live, hence
  // the transaction rather than a read-then-write.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateRoomCode();
    const codeRef = ref(getDb(), paths.roomCode(code));

    const result = await runTransaction(codeRef, (current) =>
      current === null ? roomId : undefined,
    );

    if (result.committed) return code;
  }

  throw new Error('تعذّر إنشاء رمز غرفة. حاول مرة أخرى.');
}

export interface CreateRoomOptions {
  name: string;
  characterId: string;
  variant?: string;
}

export async function createRoom(options: CreateRoomOptions): Promise<Room> {
  const user = await ensureSignedIn();
  const db = getDb();

  const roomId = crypto.randomUUID();

  // The room record is written before the code is claimed, because the code
  // index's validation rule reads back this room's hostId.
  const room: Omit<Room, 'createdAt'> & { createdAt: object } = {
    id: roomId,
    code: '',
    hostId: user.uid,
    status: 'lobby',
    createdAt: serverTimestamp(),
  };

  await set(ref(db, paths.room(roomId)), room);

  const code = await claimUnusedCode(roomId);
  await update(ref(db, paths.room(roomId)), { code });

  /*
   * No balance snapshot is written here. The room stores ONLY the values its
   * host actually changed, and everything else resolves from the defaults in
   * code at round start (`resolveSettings`). Snapshotting the whole balance
   * instead would freeze each room at whatever the defaults were on the day it
   * was created, so a later tuning fix would never reach rooms already made.
   */

  await joinRoomById(roomId, options);

  // The authoritative createdAt is the server's; this is the local echo used
  // only until the room subscription delivers the real record.
  return { ...room, code, createdAt: serverNow() };
}

export async function resolveRoomCode(code: string): Promise<string> {
  const normalized = normalizeRoomCode(code);
  const snapshot = await get(ref(getDb(), paths.roomCode(normalized)));
  const roomId = snapshot.val() as string | null;

  if (!roomId) {
    throw new RoomError('not_found', 'ما لقينا غرفة بهذا الرمز.');
  }
  return roomId;
}

export async function joinRoomByCode(
  code: string,
  options: CreateRoomOptions,
): Promise<string> {
  const roomId = await resolveRoomCode(code);
  await joinRoomById(roomId, options);
  return roomId;
}

export async function joinRoomById(
  roomId: string,
  { name, characterId, variant = 'default' }: CreateRoomOptions,
): Promise<void> {
  const user = await ensureSignedIn();
  const db = getDb();

  const [roomSnapshot, playersSnapshot] = await Promise.all([
    get(ref(db, paths.room(roomId))),
    get(ref(db, paths.players(roomId))),
  ]);

  const room = roomSnapshot.val() as Room | null;
  if (!room) {
    throw new RoomError('not_found', 'ما لقينا الغرفة.');
  }

  const players = (playersSnapshot.val() as Record<string, RoomPlayer> | null) ?? {};
  const existing = players[user.uid];
  const alreadyIn = Boolean(existing);

  if (!alreadyIn) {
    if (Object.keys(players).length >= ROOM.maxPlayers) {
      throw new RoomError('full', 'الغرفة ممتلئة.');
    }
    if (room.status === 'playing') {
      throw new RoomError('in_progress', 'اللعبة بدأت. انتظر الجولة الجاية.');
    }
  }

  /*
   * Reserve the character BEFORE writing the player record. The reservation is
   * a transaction on a single node, so two players choosing the same character
   * in the same instant cannot both succeed — and the security rule refuses to
   * accept a characterId on a player record without a matching reservation, so
   * this cannot be skipped by a client that goes straight to the write.
   *
   * This throws CharacterTakenError, which the caller surfaces so the loser of
   * the race is told to pick again.
   */
  await switchCharacter(roomId, user.uid, existing?.characterId, characterId);

  await update(ref(db, paths.player(roomId, user.uid)), {
    id: user.uid,
    name: name.trim().slice(0, 16),
    characterId,
    variant,
    ready: false,
    // Preserved on rejoin so host succession order survives a reconnect.
    ...(alreadyIn ? {} : { joinedAt: serverTimestamp() }),
  });
}

export async function setReady(
  roomId: string,
  playerId: string,
  ready: boolean,
): Promise<void> {
  await set(ref(getDb(), paths.playerReady(roomId, playerId)), ready);
}

export async function setRoomMode(roomId: string, mode: GameMode): Promise<void> {
  await set(ref(getDb(), paths.roomMode(roomId)), mode);
}

/**
 * Host-only room settings. The security rule refuses this from anyone else,
 * and refuses it entirely while a round is live, so a value cannot be changed
 * mid-round to swing an outcome.
 */
export async function setRoomSettings(
  roomId: string,
  settings: Record<string, unknown>,
): Promise<void> {
  await set(ref(getDb(), paths.roomSettings(roomId)), settings);
}

export function watchRoomSettings(
  roomId: string,
  onChange: (settings: Record<string, unknown>) => void,
): () => void {
  return onValue(ref(getDb(), paths.roomSettings(roomId)), (snapshot) => {
    onChange((snapshot.val() as Record<string, unknown> | null) ?? {});
  });
}

/**
 * Explicit exit. Distinct from a disconnect, which only flips presence.
 * Releases the character reservation so the seat AND the character both free up
 * for whoever joins next.
 */
export async function leaveRoom(roomId: string, playerId: string): Promise<void> {
  await releaseAllForPlayer(roomId, playerId);
  await remove(ref(getDb(), paths.player(roomId, playerId)));
}

export function watchRoom(
  roomId: string,
  onChange: (room: Room | undefined) => void,
): () => void {
  return onValue(ref(getDb(), paths.room(roomId)), (snapshot) => {
    onChange((snapshot.val() as Room | null) ?? undefined);
  });
}

export function watchPlayers(
  roomId: string,
  onChange: (players: Record<string, RoomPlayer>) => void,
): () => void {
  return onValue(ref(getDb(), paths.players(roomId)), (snapshot) => {
    onChange((snapshot.val() as Record<string, RoomPlayer> | null) ?? {});
  });
}
