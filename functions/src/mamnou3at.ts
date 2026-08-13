/**
 * الممنوعات — trusted logic.
 *
 * Guess correctness is decided HERE and nowhere else. A client that judged its
 * own guesses would need the word to compare against, which is exactly what
 * guessers must never receive. So a guess is written by the client as plain
 * text, and the server marks it and assigns its rank.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import {
  MAMNOU3AT,
  letterHint,
  pickTaboo,
  scoreMamnouRound,
} from '../../shared/mamnou3at';
import { isCorrectGuess } from '../../shared/mozawwer';

const db = () => admin.database();

interface RoomPlayer {
  id: string;
  joinedAt: number;
}

async function connectedIds(roomId: string): Promise<string[]> {
  const [playersSnap, presenceSnap] = await Promise.all([
    db().ref(`roomPlayers/${roomId}`).get(),
    db().ref(`presence/${roomId}`).get(),
  ]);

  const players = (playersSnap.val() ?? {}) as Record<string, RoomPlayer>;
  const presence = (presenceSnap.val() ?? {}) as Record<string, { connected?: boolean }>;

  return Object.values(players)
    .filter((p) => presence[p.id]?.connected !== false)
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .map((p) => p.id);
}

export const startMamnouRound = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'سجّل دخول أولاً.');

  const roomId = String(request.data?.roomId ?? '');
  const hostId = (await db().ref(`rooms/${roomId}/hostId`).get()).val();
  if (hostId !== uid) throw new HttpsError('permission-denied', 'المضيف فقط.');

  const playerIds = await connectedIds(roomId);
  if (playerIds.length < 3) {
    throw new HttpsError('failed-precondition', 'نحتاج 3 لاعبين على الأقل.');
  }

  const usedSnap = await db().ref(`rooms/${roomId}/usedWords`).get();
  const used = Object.values(usedSnap.val() ?? {}) as string[];
  const entry = pickTaboo(used);

  // Rotate the artist rather than always picking the host or the first joiner.
  const previousSnap = await db().ref(`rooms/${roomId}/lastArtistId`).get();
  const previous = previousSnap.val() as string | null;
  const candidates = playerIds.filter((id) => id !== previous);
  const artistId = (candidates[Math.floor(Math.random() * candidates.length)] ??
    playerIds[0]) as string;

  const gameId = db().ref().push().key as string;

  /*
   * Only the artist's secret carries the word and the forbidden list. Guessers
   * get the letter hint instead — a count, never the letters, so the answer
   * cannot be reconstructed from what is on their device.
   */
  const secrets: Record<string, unknown> = {};
  for (const id of playerIds) {
    secrets[id] =
      id === artistId
        ? { role: 'artist', word: entry.word, forbidden: entry.forbidden }
        : { role: 'guesser', hint: letterHint(entry.word) };
  }

  await db()
    .ref()
    .update({
      [`playerSecrets/${roomId}/${gameId}`]: secrets,
      [`rooms/${roomId}/status`]: 'playing',
      [`rooms/${roomId}/usedWords/${gameId}`]: entry.word,
      [`rooms/${roomId}/lastArtistId`]: artistId,
      [`games/${roomId}/current`]: {
        gameId,
        mode: 'mamnou3at',
        phase: 'brief',
        phaseEndsAt: Date.now() + 8000,
        artistId,
        currentPlayerId: artistId,
        guesserIds: playerIds.filter((id) => id !== artistId),
        word: entry.word,
        forbidden: entry.forbidden,
      },
    });

  return { gameId };
});

export const submitMamnouGuess = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'سجّل دخول أولاً.');

  const roomId = String(request.data?.roomId ?? '');
  const text = String(request.data?.guess ?? '').slice(0, 60);

  const gameRef = db().ref(`games/${roomId}/current`);
  const game = (await gameRef.get()).val();
  if (!game || game.phase !== 'draw') {
    throw new HttpsError('failed-precondition', 'ما في جولة شغّالة.');
  }
  if (uid === game.artistId) {
    throw new HttpsError('permission-denied', 'الرسّام ما يخمّن.');
  }

  const guessesRef = db().ref(`guesses/${roomId}/${game.gameId}`);
  const existing = (await guessesRef.get()).val() ?? {};

  // A player who already got it is locked at their rank; further guesses are
  // recorded but cannot change the order or earn a second payout.
  const alreadyCorrect = Object.values(existing as Record<string, { playerId: string; correct?: boolean }>)
    .some((g) => g.playerId === uid && g.correct);

  const correct = !alreadyCorrect && isCorrectGuess(text, game.word);

  await guessesRef.push({
    playerId: uid,
    text,
    correct,
    at: admin.database.ServerValue.TIMESTAMP,
  });

  if (!correct) return { correct: false };

  // End early once everyone has it — sitting out the rest of the timer with
  // nothing left to guess is dead air.
  const after = (await guessesRef.get()).val() ?? {};
  const winners = new Set(
    Object.values(after as Record<string, { playerId: string; correct?: boolean }>)
      .filter((g) => g.correct)
      .map((g) => g.playerId),
  );

  const guesserIds: string[] = game.guesserIds ?? [];
  if (guesserIds.every((id) => winners.has(id))) {
    await finishMamnou(roomId, game);
  }

  return { correct: true };
});

export const endMamnouRound = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'سجّل دخول أولاً.');

  const roomId = String(request.data?.roomId ?? '');
  const game = (await db().ref(`games/${roomId}/current`).get()).val();
  if (!game || game.phase !== 'draw') return { phase: game?.phase ?? null };

  await finishMamnou(roomId, game);
  return { phase: 'result' };
});

async function finishMamnou(
  roomId: string,
  game: { gameId: string; artistId: string; word: string },
): Promise<void> {
  const raw = (await db().ref(`guesses/${roomId}/${game.gameId}`).get()).val() ?? {};
  const guesses = Object.values(
    raw as Record<string, { playerId: string; correct?: boolean; at: number }>,
  );

  // First correct guess per player, in time order — the rank they earned.
  const seen = new Set<string>();
  const ranked: string[] = [];
  for (const g of guesses.filter((g) => g.correct).sort((a, b) => a.at - b.at)) {
    if (seen.has(g.playerId)) continue;
    seen.add(g.playerId);
    ranked.push(g.playerId);
  }

  const delta = scoreMamnouRound({ artistId: game.artistId, correctGuesserIds: ranked });
  const current = ((await db().ref(`playerScores/${roomId}`).get()).val() ?? {}) as Record<
    string,
    number
  >;

  const updates: Record<string, unknown> = {
    [`games/${roomId}/current/phase`]: 'result',
    [`games/${roomId}/current/phaseEndsAt`]: null,
    [`games/${roomId}/current/revealedWord`]: game.word,
    [`games/${roomId}/current/ranked`]: ranked,
    [`rooms/${roomId}/status`]: 'lobby',
  };
  for (const [playerId, points] of Object.entries(delta)) {
    updates[`playerScores/${roomId}/${playerId}`] = (current[playerId] ?? 0) + points;
  }

  await db().ref().update(updates);
}

export const beginMamnouDrawing = onCall(async (request) => {
  const roomId = String(request.data?.roomId ?? '');
  const gameRef = db().ref(`games/${roomId}/current`);
  const game = (await gameRef.get()).val();
  if (!game || game.phase !== 'brief') return { phase: game?.phase ?? null };

  await gameRef.update({
    phase: 'draw',
    phaseEndsAt: Date.now() + MAMNOU3AT.drawMs,
  });
  return { phase: 'draw' };
});
