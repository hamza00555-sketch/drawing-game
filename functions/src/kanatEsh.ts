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
import { gameSecretPath, readGameSecret } from './secrets';

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
      // The seed is the one thing nobody but the first drawer may see: a player
      // who knows where the chain started can reason backwards, and the drift
      // between start and end is the entire mode.
      [gameSecretPath(roomId, gameId)]: { seed },
      [`rooms/${roomId}/status`]: 'playing',
      [`rooms/${roomId}/usedSeeds/${gameId}`]: seed,
      [`games/${roomId}/current`]: {
        gameId,
        mode: 'kanatEsh',
        phase: 'turn',
        phaseEndsAt: Date.now() + KANAT_ESH.drawMs,
        currentIndex: 1,
        // String mirror of currentIndex. The linkStrokes rule matches it against
        // the $index wildcard, which is always a string — comparing it to the
        // number would silently never match and lock the drawer out of their
        // own canvas.
        currentIndexKey: '1',
        currentPlayerId: firstAuthor,
        totalLinks,
        authorByIndex,
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

  /*
   * Normally only the player whose turn it is submits their link. Once the
   * deadline has passed, anyone may close the turn with whatever exists — a
   * chain is a queue, and one player who put their phone down would otherwise
   * hold every other player in the room indefinitely. Before the deadline the
   * turn still belongs to exactly one person.
   */
  const isAuthor = game.currentPlayerId === uid;
  const expired = typeof game.phaseEndsAt === 'number' && Date.now() >= game.phaseEndsAt;
  if (!isAuthor && !expired) {
    throw new HttpsError('permission-denied', 'مو دورك.');
  }

  const index: number = game.currentIndex;
  const type = linkTypeAt(index);
  // A drawing link carries no text: its content is the strokes, which live in
  // their own read-gated bucket at linkStrokes/{roomId}/{gameId}/{index}. The
  // index is recorded here so the poster knows where to look.
  // A drawing link carries the index of its stroke bucket, not text. A text
  // link closed by the timeout says so, rather than silently reading as blank.
  const submitted = String(request.data?.text ?? '').slice(0, 200).trim();
  const content =
    type === 'drawing' ? String(index) : isAuthor && submitted ? submitted : 'ما لحق';

  await db().ref(`chains/${roomId}/${game.gameId}/${index}`).set({
    type,
    // The link belongs to whoever's turn it was, even when a timeout closed it.
    playerId: game.currentPlayerId,
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

    const { seed } = await readGameSecret<{ seed: string }>(roomId, game.gameId);

    const updates: Record<string, unknown> = {
      [`games/${roomId}/current/phase`]: 'reveal',
      [`games/${roomId}/current/phaseEndsAt`]: null,
      // Clearing visibleTo is safe: the rules also open chains during reveal.
      [`games/${roomId}/current/visibleTo`]: null,
      [`games/${roomId}/current/currentIndexKey`]: null,
      // «بدأنا بـ» — the poster's opening line, public now that the chain is done.
      [`games/${roomId}/current/seed`]: seed,
      [`rooms/${roomId}/status`]: 'lobby',
    };
    // What each player gained THIS round. Totals alone cannot tell a player
    // whether they just earned three points or none.
    updates[`games/${roomId}/current/scoreDelta`] = delta;
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
    currentIndexKey: String(nextIndex),
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
