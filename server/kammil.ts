/**
 * كمّل رسمتي — trusted logic.
 *
 * The whole mode hangs on timing nobody can game, so the server owns every
 * deadline. Clients ask to advance; they never decide when a turn ended.
 *
 * `phaseEndsAt` is written from the server clock, which is what makes a
 * two-second turn identical on ten phones whose own clocks disagree.
 */

import { db } from './admin.js';
import { GameError } from './errors.js';
import type { RequestData } from './types.js';

import {
  KAMMIL,
  assignKammilRoles,
  kammilDrawMs,
  scoreKammilDuoRound,
  scoreKammilRound,
} from '../shared/kammil.js';
import { MOZAWWER_WORDS, isCorrectGuess } from '../shared/mozawwer.js';
import { gameSecretPath, readGameSecret } from './secrets.js';

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

export async function startKammilRound(uid: string, data: RequestData): Promise<unknown> {

  const roomId = String(data.roomId ?? '');
  const hostId = (await db().ref(`rooms/${roomId}/hostId`).get()).val();
  if (hostId !== uid) throw new GameError('permission-denied', 'المضيف فقط.');

  const playerIds = await connectedIds(roomId);
  if (playerIds.length < KAMMIL.minPlayers) {
    throw new GameError('failed-precondition', `نحتاج ${KAMMIL.minPlayers} لاعبين على الأقل.`);
  }

  const isDuo = playerIds.length === 2;
  const previousGuesserSnap = isDuo
    ? await db().ref(`rooms/${roomId}/lastKammilGuesserId`).get()
    : undefined;
  const { artistIds, guesserId } = assignKammilRoles(
    playerIds,
    Math.random,
    (previousGuesserSnap?.val() as string | null) ?? null,
  );
  const word = MOZAWWER_WORDS[Math.floor(Math.random() * MOZAWWER_WORDS.length)];
  if (!word) throw new GameError('internal', 'تعذّر اختيار كلمة.');

  const countdownMs = isDuo ? KAMMIL.duo.countdownMs : KAMMIL.countdownMs;
  const turnMs = isDuo ? KAMMIL.duo.turnMs : kammilDrawMs(artistIds.length);

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
      // The guesser is a member of the room, so the readable game node must not
      // carry the word. It lives here until the reveal.
      [gameSecretPath(roomId, gameId)]: { word: word.word },
      [`rooms/${roomId}/status`]: 'playing',
      [`games/${roomId}/current`]: {
        gameId,
        mode: 'kammil',
        phase: 'countdown',
        phaseEndsAt: Date.now() + countdownMs,
        artistIds,
        guesserId,
        turnIndex: 0,
        currentPlayerId: artistIds[0],
        turnMs,
        countdownMs,
        isDuo,
        extensionsUsed: 0,
      },
    });

  return { gameId };
}

export async function advanceKammil(uid: string, data: RequestData): Promise<unknown> {

  const roomId = String(data.roomId ?? '');
  const action = String(data.action ?? '');

  const gameRef = db().ref(`games/${roomId}/current`);
  const game = (await gameRef.get()).val();
  if (!game) throw new GameError('failed-precondition', 'ما في جولة شغّالة.');

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

      /*
       * Two devices watch this deadline — the artist whose pen it is, and the
       * host as a fallback for an artist who has left. Both may call in the same
       * instant, and without this guard the second call would land after the
       * first advanced the state and skip an entire artist's turn. The caller
       * states which turn it believes is ending; a stale answer is discarded.
       */
      const expected = data.turnIndex;
      if (typeof expected === 'number' && expected !== game.turnIndex) {
        return { phase: game.phase };
      }

      const nextIndex = game.turnIndex + 1;
      const guessMs = game.isDuo ? KAMMIL.duo.guessMs : KAMMIL.guessMs;
      const countdownMs = game.isDuo ? KAMMIL.duo.countdownMs : KAMMIL.countdownMs;

      if (nextIndex >= artistIds.length) {
        await gameRef.update({
          phase: 'guess',
          phaseEndsAt: Date.now() + guessMs,
          currentPlayerId: game.guesserId,
        });
        return { phase: 'guess' };
      }

      await gameRef.update({
        phase: 'countdown',
        phaseEndsAt: Date.now() + countdownMs,
        turnIndex: nextIndex,
        currentPlayerId: artistIds[nextIndex],
      });
      return { phase: 'countdown' };
    }

    // `closeGuess` is the same ending with nobody to answer: the guesser's time
    // ran out, or they left. Anyone may call it, but only after the deadline,
    // so it cannot be used to cut the guesser's thinking short.
    case 'closeGuess':
    case 'submitGuess': {
      if (game.phase !== 'guess') return { phase: game.phase };

      const timedOut = action === 'closeGuess';
      if (timedOut) {
        if (typeof game.phaseEndsAt === 'number' && Date.now() < game.phaseEndsAt) {
          return { phase: game.phase };
        }
      } else if (uid !== game.guesserId) {
        throw new GameError('permission-denied', 'التخمين للاعب الأخير.');
      }

      const guess = timedOut ? '' : String(data.guess ?? '');
      const { word } = await readGameSecret<{ word: string }>(roomId, game.gameId);
      const correct = isCorrectGuess(guess, word);
      const extensionsUsed: number = game.extensionsUsed ?? 0;

      // Duo: a wrong guess is not necessarily the end — the artist gets one
      // short bonus window before the round is decided, capped at one use.
      if (game.isDuo && !correct && extensionsUsed < KAMMIL.duo.maxExtensions) {
        await gameRef.update({
          phase: 'extend',
          phaseEndsAt: Date.now() + KAMMIL.duo.extendMs,
          currentPlayerId: artistIds[0],
          extensionsUsed: extensionsUsed + 1,
        });
        return { phase: 'extend' };
      }

      const delta = game.isDuo
        ? scoreKammilDuoRound({
            artistId: artistIds[0] as string,
            guesserId: game.guesserId,
            correct,
            afterExtend: extensionsUsed > 0,
          })
        : scoreKammilRound({ artistIds, guesserId: game.guesserId, correct });
      const current = ((await db().ref(`playerScores/${roomId}`).get()).val() ?? {}) as Record<
        string,
        number
      >;

      const updates: Record<string, unknown> = {
        [`games/${roomId}/current/phase`]: 'reveal',
        [`games/${roomId}/current/phaseEndsAt`]: null,
        [`games/${roomId}/current/guess`]: guess,
        [`games/${roomId}/current/correct`]: correct,
        [`games/${roomId}/current/revealedWord`]: word,
        [`rooms/${roomId}/status`]: 'lobby',
      };
      // Duo only: next round's role assignment swaps off of this.
      if (game.isDuo) updates[`rooms/${roomId}/lastKammilGuesserId`] = game.guesserId;
      // What each player gained THIS round. Totals alone cannot tell a player
      // whether they just earned three points or none.
      updates[`games/${roomId}/current/scoreDelta`] = delta;
      for (const [playerId, points] of Object.entries(delta)) {
        updates[`playerScores/${roomId}/${playerId}`] = (current[playerId] ?? 0) + points;
      }

      await db().ref().update(updates);
      return { phase: 'reveal', correct };
    }

    // Duo only: the bonus drawing window ended (timer, or the artist is done
    // early); back to the guesser for one more try. Idempotent for the same
    // reason `startTurn` is — both the artist and the host may call this.
    case 'endExtend': {
      if (game.phase !== 'extend' || !game.isDuo) return { phase: game.phase };

      await gameRef.update({
        phase: 'guess',
        phaseEndsAt: Date.now() + KAMMIL.duo.guessMs,
        currentPlayerId: game.guesserId,
      });
      return { phase: 'guess' };
    }

    case 'toResult': {
      if (game.phase !== 'reveal') return { phase: game.phase };
      await gameRef.update({ phase: 'result' });
      return { phase: 'result' };
    }

    default:
      throw new GameError('invalid-argument', `إجراء غير معروف: ${action}`);
  }
}
