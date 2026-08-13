/**
 * كانت إيش؟ — trusted logic.
 *
 * The mode's secret is not a word; it is the SHAPE of the chain. So the server
 * maintains `visibleTo`, a per-link map of which player may read it — and the
 * database rule for `chains` checks exactly that node.
 *
 * A client cannot widen its own visibility, and no client is ever sent the
 * whole chain until the reveal.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import {
  KANAT_ESH,
  chainAssignments,
  chainLength,
  linkTypeAt,
  pickSeed,
  readableLinkIndex,
  scoreKanatEshRound,
} from '../../shared/kanatEsh';

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

/**
 * Grant read access to exactly one link, for exactly one player.
 * Written as a replacement, never a merge, so a previous turn's grant is
 * revoked the moment the chain moves on.
 */
function visibilityFor(linkIndex: number, playerId: string): Record<string, unknown> {
  return { [`${linkIndex}`]: { [playerId]: true } };
}

export const startKanatEshRound = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'سجّل دخول أولاً.');

  const roomId = String(request.data?.roomId ?? '');
  const hostId = (await db().ref(`rooms/${roomId}/hostId`).get()).val();
  if (hostId !== uid) throw new HttpsError('permission-denied', 'المضيف فقط.');

  const playerIds = await connectedIds(roomId);
  if (playerIds.length < 3) {
    throw new HttpsError('failed-precondition', 'نحتاج 3 لاعبين على الأقل.');
  }

  const usedSnap = await db().ref(`rooms/${roomId}/usedSeeds`).get();
  const seed = pickSeed(Object.values(usedSnap.val() ?? {}) as string[]);

  const totalLinks = chainLength(playerIds.length);
  const authors = chainAssignments(playerIds, totalLinks);

  const authorByIndex: Record<string, string> = {};
  authors.forEach((playerId, i) => {
    authorByIndex[String(i + 1)] = playerId;
  });

  const gameId = db().ref().push().key as string;
  const firstAuthor = authors[0] as string;

  await db()
    .ref()
    .update({
      // The seed is link 0. It is stored in the chain so the poster can show it,
      // but its visibility is granted only to the player drawing link 1.
      [`chains/${roomId}/${gameId}/0`]: {
        type: 'text',
        playerId: 'seed',
        content: seed,
      },
      [`rooms/${roomId}/status`]: 'playing',
      [`rooms/${roomId}/usedSeeds/${gameId}`]: seed,
      [`games/${roomId}/current`]: {
        gameId,
        mode: 'kanatEsh',
        phase: 'turn',
        phaseEndsAt: Date.now() + KANAT_ESH.drawMs,
        currentIndex: 1,
        currentPlayerId: firstAuthor,
        totalLinks,
        authorByIndex,
        seed,
        visibleTo: visibilityFor(0, firstAuthor),
      },
    });

  return { gameId };
});

export const submitKanatEshLink = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'سجّل دخول أولاً.');

  const roomId = String(request.data?.roomId ?? '');
  const gameRef = db().ref(`games/${roomId}/current`);
  const game = (await gameRef.get()).val();

  if (!game || game.phase !== 'turn') {
    throw new HttpsError('failed-precondition', 'ما في جولة شغّالة.');
  }
  if (game.currentPlayerId !== uid) {
    throw new HttpsError('permission-denied', 'مو دورك.');
  }

  const index: number = game.currentIndex;
  const type = linkTypeAt(index);
  const content =
    type === 'text' ? String(request.data?.text ?? '').slice(0, 200) : String(game.gameId);

  await db().ref(`chains/${roomId}/${game.gameId}/${index}`).set({
    type,
    playerId: uid,
    content,
  });

  const nextIndex = index + 1;

  // Chain complete: open everything at once.
  if (nextIndex >= game.totalLinks) {
    const playerIds = await connectedIds(roomId);
    const authorByIndex: Record<number, string> = {};
    for (const [key, value] of Object.entries(game.authorByIndex ?? {})) {
      authorByIndex[Number(key)] = value as string;
    }

    /*
     * Faithfulness is not judged automatically. Deciding whether a drawing
     * "matched" a sentence is a human call, and a bad automatic judgement would
     * hand out points the room disagrees with. Everyone gets the completion
     * award; faithful-link bonuses are left for a future vote.
     */
    const delta = scoreKanatEshRound({ authorByIndex, faithfulIndices: [], playerIds });
    const current = ((await db().ref(`playerScores/${roomId}`).get()).val() ?? {}) as Record<
      string,
      number
    >;

    const updates: Record<string, unknown> = {
      [`games/${roomId}/current/phase`]: 'reveal',
      [`games/${roomId}/current/phaseEndsAt`]: null,
      // Clearing visibleTo is safe: the rules also open chains during reveal.
      [`games/${roomId}/current/visibleTo`]: null,
      [`rooms/${roomId}/status`]: 'lobby',
    };
    for (const [playerId, points] of Object.entries(delta)) {
      updates[`playerScores/${roomId}/${playerId}`] = (current[playerId] ?? 0) + points;
    }

    await db().ref().update(updates);
    return { phase: 'reveal' };
  }

  const nextAuthor = game.authorByIndex?.[String(nextIndex)] as string | undefined;
  if (!nextAuthor) throw new HttpsError('internal', 'ما لقينا اللاعب التالي.');

  const nextType = linkTypeAt(nextIndex);

  await gameRef.update({
    currentIndex: nextIndex,
    currentPlayerId: nextAuthor,
    phaseEndsAt: Date.now() + (nextType === 'drawing' ? KANAT_ESH.drawMs : KANAT_ESH.writeMs),
    // Replaced wholesale, so the previous player's grant is revoked.
    visibleTo: visibilityFor(readableLinkIndex(nextIndex), nextAuthor),
  });

  return { phase: 'turn', index: nextIndex };
});

export const kanatEshToResult = onCall(async (request) => {
  const roomId = String(request.data?.roomId ?? '');
  const gameRef = db().ref(`games/${roomId}/current`);
  const game = (await gameRef.get()).val();
  if (!game || game.phase !== 'reveal') return { phase: game?.phase ?? null };

  await gameRef.update({ phase: 'result' });
  return { phase: 'result' };
});
