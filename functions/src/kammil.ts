/**
 * كمّل رسمتي — trusted logic.
 *
 * The whole mode hangs on timing nobody can game, so the server owns every
 * deadline. Clients ask to advance; they never decide when a turn ended.
 *
 * `phaseEndsAt` is written from the server clock, which is what makes a
 * two-second turn identical on ten phones whose own clocks disagree.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { KAMMIL, assignKammilRoles, kammilDrawMs, scoreKammilRound } from '../../shared/kammil';
import { MOZAWWER_WORDS, isCorrectGuess } from '../../shared/mozawwer';

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

export const startKammilRound = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'سجّل دخول أولاً.');

  const roomId = String(request.data?.roomId ?? '');
  const hostId = (await db().ref(`rooms/${roomId}/hostId`).get()).val();
  if (hostId !== uid) throw new HttpsError('permission-denied', 'المضيف فقط.');

  const playerIds = await connectedIds(roomId);
  if (playerIds.length < 3) {
    throw new HttpsError('failed-precondition', 'نحتاج 3 لاعبين على الأقل.');
  }

  const { artistIds, guesserId } = assignKammilRoles(playerIds);
  const word = MOZAWWER_WORDS[Math.floor(Math.random() * MOZAWWER_WORDS.length)];
  if (!word) throw new HttpsError('internal', 'تعذّر اختيار كلمة.');

  const gameId = db().ref().push().key as string;

  /*
   * Secrets, per player. The guesser's payload has NO `word` key — they must
   * reach the answer from the drawing alone, and there is nothing on their
   * device to read instead.
   */
  const secrets: Record<string, { role: string; word?: string }> = {};
  for (const id of playerIds) {
    secrets[id] = id === guesserId ? { role: 'guesser' } : { role: 'artist', word: word.word };
  }

  await db()
    .ref()
    .update({
      [`playerSecrets/${roomId}/${gameId}`]: secrets,
      [`rooms/${roomId}/status`]: 'playing',
      [`games/${roomId}/current`]: {
        gameId,
        mode: 'kammil',
        phase: 'countdown',
        phaseEndsAt: Date.now() + KAMMIL.countdownMs,
        artistIds,
        guesserId,
        turnIndex: 0,
        currentPlayerId: artistIds[0],
        word: word.word,
        turnMs: kammilDrawMs(artistIds.length),
      },
    });

  return { gameId };
});

export const advanceKammil = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'سجّل دخول أولاً.');

  const roomId = String(request.data?.roomId ?? '');
  const action = String(request.data?.action ?? '');

  const gameRef = db().ref(`games/${roomId}/current`);
  const game = (await gameRef.get()).val();
  if (!game) throw new HttpsError('failed-precondition', 'ما في جولة شغّالة.');

  const artistIds: string[] = game.artistIds ?? [];

  switch (action) {
    case 'startTurn': {
      // The countdown expired; the pen unlocks. Idempotent, because every
      // client's countdown finishes at roughly the same moment and they will
      // all call this.
      if (game.phase !== 'countdown') return { phase: game.phase };

      await gameRef.update({
        phase: 'turn',
        phaseEndsAt: Date.now() + (game.turnMs ?? kammilDrawMs(artistIds.length)),
      });
      return { phase: 'turn' };
    }

    case 'endTurn': {
      if (game.phase !== 'turn') return { phase: game.phase };

      const nextIndex = game.turnIndex + 1;

      if (nextIndex >= artistIds.length) {
        await gameRef.update({
          phase: 'guess',
          phaseEndsAt: Date.now() + KAMMIL.guessMs,
          currentPlayerId: game.guesserId,
        });
        return { phase: 'guess' };
      }

      await gameRef.update({
        phase: 'countdown',
        phaseEndsAt: Date.now() + KAMMIL.countdownMs,
        turnIndex: nextIndex,
        currentPlayerId: artistIds[nextIndex],
      });
      return { phase: 'countdown' };
    }

    case 'submitGuess': {
      if (game.phase !== 'guess') return { phase: game.phase };
      if (uid !== game.guesserId) {
        throw new HttpsError('permission-denied', 'التخمين للاعب الأخير.');
      }

      const guess = String(request.data?.guess ?? '');
      const correct = isCorrectGuess(guess, game.word);

      const delta = scoreKammilRound({ artistIds, guesserId: game.guesserId, correct });
      const current = ((await db().ref(`playerScores/${roomId}`).get()).val() ?? {}) as Record<
        string,
        number
      >;

      const updates: Record<string, unknown> = {
        [`games/${roomId}/current/phase`]: 'reveal',
        [`games/${roomId}/current/phaseEndsAt`]: null,
        [`games/${roomId}/current/guess`]: guess,
        [`games/${roomId}/current/correct`]: correct,
        [`games/${roomId}/current/revealedWord`]: game.word,
        [`rooms/${roomId}/status`]: 'lobby',
      };
      for (const [playerId, points] of Object.entries(delta)) {
        updates[`playerScores/${roomId}/${playerId}`] = (current[playerId] ?? 0) + points;
      }

      await db().ref().update(updates);
      return { phase: 'reveal', correct };
    }

    case 'toResult': {
      if (game.phase !== 'reveal') return { phase: game.phase };
      await gameRef.update({ phase: 'result' });
      return { phase: 'result' };
    }

    default:
      throw new HttpsError('invalid-argument', `إجراء غير معروف: ${action}`);
  }
});
