/**
 * الرسم المشترك — trusted logic.
 *
 * The split prompt is the secret here: each artist's payload carries ONLY their
 * own half. Neither artist can read the other's, and guessers get neither —
 * so the collision on the canvas is genuine and not something a client could
 * spoil by inspecting its own state.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { MUSHTARAK, pickArtistPair, pickCombo, scoreMushtarakRound } from '../../shared/mushtarak';
import { isCorrectGuess } from '../../shared/mozawwer';

const db = () => admin.database();

async function connectedIds(roomId: string): Promise<string[]> {
  const [playersSnap, presenceSnap] = await Promise.all([
    db().ref(`roomPlayers/${roomId}`).get(),
    db().ref(`presence/${roomId}`).get(),
  ]);

  const players = (playersSnap.val() ?? {}) as Record<string, { id: string; joinedAt: number }>;
  const presence = (presenceSnap.val() ?? {}) as Record<string, { connected?: boolean }>;

  return Object.values(players)
    .filter((p) => presence[p.id]?.connected !== false)
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .map((p) => p.id);
}

export const startMushtarakRound = onCall(async (request) => {
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
  const prevSnap = await db().ref(`rooms/${roomId}/lastArtistPair`).get();

  const combo = pickCombo(Object.values(usedSnap.val() ?? {}) as string[]);
  const { artistIds, guesserIds } = pickArtistPair(
    playerIds,
    (prevSnap.val() ?? []) as string[],
  );

  const gameId = db().ref().push().key as string;

  // Each artist gets ONLY their own half.
  const secrets: Record<string, unknown> = {};
  secrets[artistIds[0]] = { role: 'artist', part: combo.partA };
  secrets[artistIds[1]] = { role: 'artist', part: combo.partB };
  for (const id of guesserIds) secrets[id] = { role: 'guesser' };

  await db()
    .ref()
    .update({
      [`playerSecrets/${roomId}/${gameId}`]: secrets,
      [`rooms/${roomId}/status`]: 'playing',
      [`rooms/${roomId}/usedWords/${gameId}`]: combo.full,
      [`rooms/${roomId}/lastArtistPair`]: artistIds,
      [`games/${roomId}/current`]: {
        gameId,
        mode: 'mushtarak',
        phase: 'brief',
        phaseEndsAt: Date.now() + 6000,
        artistIds,
        guesserIds,
        // activeDrawers is what the stroke security rule checks — this is the
        // one mode where more than one player may write strokes at once.
        activeDrawers: Object.fromEntries(artistIds.map((id) => [id, true])),
        partA: combo.partA,
        partB: combo.partB,
        full: combo.full,
      },
    });

  return { gameId };
});

export const advanceMushtarak = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'سجّل دخول أولاً.');

  const roomId = String(request.data?.roomId ?? '');
  const action = String(request.data?.action ?? '');

  const gameRef = db().ref(`games/${roomId}/current`);
  const game = (await gameRef.get()).val();
  if (!game) throw new HttpsError('failed-precondition', 'ما في جولة شغّالة.');

  switch (action) {
    case 'beginDrawing': {
      if (game.phase !== 'brief') return { phase: game.phase };
      await gameRef.update({ phase: 'draw', phaseEndsAt: Date.now() + MUSHTARAK.drawMs });
      return { phase: 'draw' };
    }

    case 'gotYou': {
      if (game.phase !== 'draw') return { phase: game.phase };
      if (!(game.artistIds ?? []).includes(uid)) {
        throw new HttpsError('permission-denied', 'للرسّامين فقط.');
      }

      const used: string[] = Object.keys(game.gotYouUsedBy ?? {});
      if (used.includes(uid)) {
        throw new HttpsError('failed-precondition', 'استخدمتها.');
      }

      await gameRef.update({
        [`gotYouUsedBy/${uid}`]: true,
        gotYouFrom: uid,
        gotYouAt: admin.database.ServerValue.TIMESTAMP,
      });
      return { sent: true };
    }

    case 'endDrawing': {
      if (game.phase !== 'draw') return { phase: game.phase };
      await gameRef.update({
        phase: 'guess',
        phaseEndsAt: Date.now() + MUSHTARAK.guessMs,
        // Nobody may draw once guessing starts.
        activeDrawers: null,
      });
      return { phase: 'guess' };
    }

    case 'submitGuess': {
      if (game.phase !== 'guess') return { phase: game.phase };
      if ((game.artistIds ?? []).includes(uid)) {
        throw new HttpsError('permission-denied', 'الرسّام ما يخمّن.');
      }

      const text = String(request.data?.guess ?? '').slice(0, 60);
      const correct = isCorrectGuess(text, game.full);

      await db().ref(`guesses/${roomId}/${game.gameId}`).push({
        playerId: uid,
        text,
        correct,
        at: admin.database.ServerValue.TIMESTAMP,
      });
      return { correct };
    }

    case 'toReveal': {
      if (game.phase !== 'guess') return { phase: game.phase };

      const raw = (await db().ref(`guesses/${roomId}/${game.gameId}`).get()).val() ?? {};
      const correctIds = [
        ...new Set(
          Object.values(raw as Record<string, { playerId: string; correct?: boolean }>)
            .filter((g) => g.correct)
            .map((g) => g.playerId),
        ),
      ];

      const delta = scoreMushtarakRound({
        artistIds: game.artistIds ?? [],
        correctGuesserIds: correctIds,
      });
      const current = ((await db().ref(`playerScores/${roomId}`).get()).val() ?? {}) as Record<
        string,
        number
      >;

      const updates: Record<string, unknown> = {
        [`games/${roomId}/current/phase`]: 'reveal',
        [`games/${roomId}/current/phaseEndsAt`]: null,
        [`games/${roomId}/current/correctGuesserIds`]: correctIds,
        [`rooms/${roomId}/status`]: 'lobby',
      };
      for (const [playerId, points] of Object.entries(delta)) {
        updates[`playerScores/${roomId}/${playerId}`] = (current[playerId] ?? 0) + points;
      }

      await db().ref().update(updates);
      return { phase: 'reveal' };
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
