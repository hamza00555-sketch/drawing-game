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

import { db } from './admin.js';
import { GameError } from './errors.js';
import type { RequestData } from './types.js';

import {
  KANAT_ESH,
  chainAssignments,
  chainAssignmentsDuo,
  chainLength,
  duoLinksPerTrack,
  linkTypeAt,
  pickSeed,
  pickTwoDistinctSeeds,
  readableLinkIndex,
  scoreKanatEshRound,
} from '../shared/kanatEsh.js';
import { gameSecretPath, readGameSecret } from './secrets.js';

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

export async function startKanatEshRound(uid: string, data: RequestData): Promise<unknown> {

  const roomId = String(data.roomId ?? '');
  const hostId = (await db().ref(`rooms/${roomId}/hostId`).get()).val();
  if (hostId !== uid) throw new GameError('permission-denied', 'المضيف فقط.');

  const playerIds = await connectedIds(roomId);
  if (playerIds.length < KANAT_ESH.minPlayers) {
    throw new GameError('failed-precondition', `نحتاج ${KANAT_ESH.minPlayers} لاعبين على الأقل.`);
  }

  const isDuo = playerIds.length === 2;

  const usedSnap = await db().ref(`rooms/${roomId}/usedSeeds`).get();
  const used = Object.values(usedSnap.val() ?? {}) as string[];

  if (isDuo) {
    const [p1, p2] = playerIds as [string, string];
    const [seedA, seedB] = pickTwoDistinctSeeds(used);
    const linksPerTrack = duoLinksPerTrack();

    const authorsByTrack: Record<'0' | '1', string[]> = {
      '0': chainAssignmentsDuo(p1, p2, linksPerTrack),
      '1': chainAssignmentsDuo(p2, p1, linksPerTrack),
    };

    const gameId = db().ref().push().key as string;
    const firstDuration =
      linkTypeAt(1) === 'drawing' ? KANAT_ESH.duo.drawMs : KANAT_ESH.duo.writeMs;

    const tracks: Record<string, unknown> = {};
    const visibleTo: Record<string, unknown> = {};
    for (const [track, owner] of [
      ['0', p1],
      ['1', p2],
    ] as const) {
      const authorByIndex: Record<string, string> = {};
      authorsByTrack[track].forEach((playerId, i) => {
        authorByIndex[String(i + 1)] = playerId;
      });
      const firstAuthor = authorsByTrack[track][0] as string;

      tracks[track] = {
        ownerId: owner,
        currentIndex: 1,
        currentIndexKey: '1',
        currentPlayerId: firstAuthor,
        totalLinks: linksPerTrack,
        authorByIndex,
        phaseEndsAt: Date.now() + firstDuration,
      };
      visibleTo[track] = visibilityFor(0, firstAuthor);
    }

    await db()
      .ref()
      .update({
        [`duoChains/${roomId}/${gameId}/0/0`]: { type: 'text', playerId: 'seed', content: seedA },
        [`duoChains/${roomId}/${gameId}/1/0`]: { type: 'text', playerId: 'seed', content: seedB },
        [gameSecretPath(roomId, gameId)]: { seedA, seedB },
        [`rooms/${roomId}/status`]: 'playing',
        [`rooms/${roomId}/usedSeeds/${gameId}A`]: seedA,
        [`rooms/${roomId}/usedSeeds/${gameId}B`]: seedB,
        [`games/${roomId}/current`]: {
          gameId,
          mode: 'kanatEsh',
          phase: 'turn',
          isDuo: true,
          linksPerTrack,
          tracks,
          visibleTo,
        },
      });

    return { gameId };
  }

  const seed = pickSeed(used);

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
}

export async function submitKanatEshLink(uid: string, data: RequestData): Promise<unknown> {

  const roomId = String(data.roomId ?? '');
  const gameRef = db().ref(`games/${roomId}/current`);
  const game = (await gameRef.get()).val();

  if (!game || game.phase !== 'turn') {
    throw new GameError('failed-precondition', 'ما في جولة شغّالة.');
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
    throw new GameError('permission-denied', 'مو دورك.');
  }

  const index: number = game.currentIndex;
  const type = linkTypeAt(index);
  // A drawing link carries no text: its content is the strokes, which live in
  // their own read-gated bucket at linkStrokes/{roomId}/{gameId}/{index}. The
  // index is recorded here so the poster knows where to look.
  // A drawing link carries the index of its stroke bucket, not text. A text
  // link closed by the timeout says so, rather than silently reading as blank.
  const submitted = String(data.text ?? '').slice(0, 200).trim();
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
  if (!nextAuthor) throw new GameError('internal', 'ما لقينا اللاعب التالي.');

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
}

/**
 * Duo only: submit the current link on ONE track.
 *
 * The two tracks are otherwise independent — each has its own author, its own
 * deadline, its own visibility grant — so this only ever touches the one
 * `tracks/{track}` the caller names. The round as a whole only moves to
 * `reveal` once BOTH tracks report `done`.
 */
export async function submitKanatEshLinkDuo(uid: string, data: RequestData): Promise<unknown> {
  const roomId = String(data.roomId ?? '');
  const track = String(data.track ?? '');
  if (track !== '0' && track !== '1') {
    throw new GameError('invalid-argument', 'مسار غير معروف.');
  }

  const gameRef = db().ref(`games/${roomId}/current`);
  const game = (await gameRef.get()).val();

  if (!game || game.phase !== 'turn' || !game.isDuo) {
    throw new GameError('failed-precondition', 'ما في جولة شغّالة.');
  }

  const trackState = game.tracks?.[track];
  if (!trackState) throw new GameError('internal', 'ما لقينا المسار.');

  const isAuthor = trackState.currentPlayerId === uid;
  const expired =
    typeof trackState.phaseEndsAt === 'number' && Date.now() >= trackState.phaseEndsAt;
  if (!isAuthor && !expired) {
    throw new GameError('permission-denied', 'مو دورك.');
  }

  const index: number = trackState.currentIndex;
  const type = linkTypeAt(index);
  const submitted = String(data.text ?? '').slice(0, 200).trim();
  const content =
    type === 'drawing' ? String(index) : isAuthor && submitted ? submitted : 'ما لحق';

  await db().ref(`duoChains/${roomId}/${game.gameId}/${track}/${index}`).set({
    type,
    playerId: trackState.currentPlayerId,
    content,
  });

  const nextIndex = index + 1;
  const totalLinks: number = trackState.totalLinks;

  if (nextIndex >= totalLinks) {
    const otherTrack = track === '0' ? '1' : '0';
    const otherDone = Boolean(game.tracks?.[otherTrack]?.done);

    if (!otherDone) {
      // This track is done; the other one is still going. Nothing to reveal
      // yet — just record that this track has nothing left to submit.
      await gameRef.update({
        [`tracks/${track}/currentIndex`]: nextIndex,
        [`tracks/${track}/done`]: true,
        [`tracks/${track}/phaseEndsAt`]: null,
      });
      return { phase: 'turn', trackDone: track };
    }

    // Both tracks are done: close the round out, same as the group version.
    const playerIds = await connectedIds(roomId);
    const delta = scoreKanatEshRound({ authorByIndex: {}, faithfulIndices: [], playerIds });
    const current = ((await db().ref(`playerScores/${roomId}`).get()).val() ?? {}) as Record<
      string,
      number
    >;
    const { seedA, seedB } = await readGameSecret<{ seedA: string; seedB: string }>(
      roomId,
      game.gameId,
    );

    const updates: Record<string, unknown> = {
      [`games/${roomId}/current/tracks/${track}/currentIndex`]: nextIndex,
      [`games/${roomId}/current/tracks/${track}/done`]: true,
      [`games/${roomId}/current/tracks/${track}/phaseEndsAt`]: null,
      [`games/${roomId}/current/phase`]: 'reveal',
      [`games/${roomId}/current/visibleTo`]: null,
      [`games/${roomId}/current/seedA`]: seedA,
      [`games/${roomId}/current/seedB`]: seedB,
      [`rooms/${roomId}/status`]: 'lobby',
    };
    updates[`games/${roomId}/current/scoreDelta`] = delta;
    for (const [playerId, points] of Object.entries(delta)) {
      updates[`playerScores/${roomId}/${playerId}`] = (current[playerId] ?? 0) + points;
    }

    await db().ref().update(updates);
    return { phase: 'reveal' };
  }

  const nextAuthor = trackState.authorByIndex?.[String(nextIndex)] as string | undefined;
  if (!nextAuthor) throw new GameError('internal', 'ما لقينا اللاعب التالي.');

  const nextType = linkTypeAt(nextIndex);
  const duration = nextType === 'drawing' ? KANAT_ESH.duo.drawMs : KANAT_ESH.duo.writeMs;

  await gameRef.update({
    [`tracks/${track}/currentIndex`]: nextIndex,
    [`tracks/${track}/currentIndexKey`]: String(nextIndex),
    [`tracks/${track}/currentPlayerId`]: nextAuthor,
    [`tracks/${track}/phaseEndsAt`]: Date.now() + duration,
    // Replaced wholesale, so the previous author's grant on this track is
    // revoked — mirrors the single-chain version exactly, just scoped deeper.
    [`visibleTo/${track}`]: visibilityFor(readableLinkIndex(nextIndex), nextAuthor),
  });

  return { phase: 'turn', track };
}

export async function kanatEshToResult(_uid: string, data: RequestData): Promise<unknown> {
  const roomId = String(data.roomId ?? '');
  const gameRef = db().ref(`games/${roomId}/current`);
  const game = (await gameRef.get()).val();
  if (!game || game.phase !== 'reveal') return { phase: game?.phase ?? null };

  await gameRef.update({ phase: 'result' });
  return { phase: 'result' };
}
