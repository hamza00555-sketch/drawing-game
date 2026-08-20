/**
 * الرسم المشترك — trusted logic.
 *
 * The split prompt is the secret here: each artist's payload carries ONLY their
 * own half. Neither artist can read the other's, and guessers get neither —
 * so the collision on the canvas is genuine and not something a client could
 * spoil by inspecting its own state.
 */

import { db, ServerValue } from './admin.js';
import { GameError } from './errors.js';
import type { RequestData } from './types.js';

import {
  MUSHTARAK,
  pickArtistPair,
  pickCombo,
  scoreMushtarakDuoRound,
  scoreMushtarakRound,
} from '../shared/mushtarak.js';
import { isCorrectGuess } from '../shared/mozawwer.js';
import { gameSecretPath, readGameSecret } from './secrets.js';

/** The split prompt. Each artist gets one half via playerSecrets; nobody gets both. */
interface MushtarakSecret {
  partA: string;
  partB: string;
  full: string;
}

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

export async function startMushtarakRound(uid: string, data: RequestData): Promise<unknown> {

  const roomId = String(data.roomId ?? '');
  const hostId = (await db().ref(`rooms/${roomId}/hostId`).get()).val();
  if (hostId !== uid) throw new GameError('permission-denied', 'المضيف فقط.');

  const playerIds = await connectedIds(roomId);
  if (playerIds.length < MUSHTARAK.minPlayers) {
    throw new GameError('failed-precondition', `نحتاج ${MUSHTARAK.minPlayers} لاعبين على الأقل.`);
  }

  const isDuo = playerIds.length === 2;

  const usedSnap = await db().ref(`rooms/${roomId}/usedWords`).get();
  const combo = pickCombo(Object.values(usedSnap.val() ?? {}) as string[]);
  const gameId = db().ref().push().key as string;

  if (isDuo) {
    const [a, b] = playerIds as [string, string];

    // The split is kept: each player is told only their own half, exactly as
    // in the group ruleset. What changes is who has to name the other half —
    // with no third player, they name each other's at the end.
    const secrets: Record<string, unknown> = {
      [a]: { role: 'artist', part: combo.partA },
      [b]: { role: 'artist', part: combo.partB },
    };

    await db()
      .ref()
      .update({
        [`playerSecrets/${roomId}/${gameId}`]: secrets,
        [gameSecretPath(roomId, gameId)]: {
          partA: combo.partA,
          partB: combo.partB,
          full: combo.full,
        },
        [`rooms/${roomId}/status`]: 'playing',
        [`rooms/${roomId}/usedWords/${gameId}`]: combo.full,
        [`games/${roomId}/current`]: {
          gameId,
          mode: 'mushtarak',
          phase: 'brief',
          phaseEndsAt: Date.now() + MUSHTARAK.duo.briefMs,
          artistIds: [a, b],
          // Both players are artists AND, at the end, each other's guessers.
          guesserIds: [],
          isDuo: true,
          turnIndex: 0,
          totalSwaps: MUSHTARAK.duo.totalSwaps,
          turnMs: MUSHTARAK.duo.turnMs,
          currentPlayerId: a,
          // No `activeDrawers`: the stroke rule falls back to matching
          // `currentPlayerId`, which is exactly the one-at-a-time turn this
          // ruleset needs — unlike the group version's simultaneous pair.
        },
      });

    return { gameId };
  }

  const prevSnap = await db().ref(`rooms/${roomId}/lastArtistPair`).get();
  const { artistIds, guesserIds } = pickArtistPair(
    playerIds,
    (prevSnap.val() ?? []) as string[],
  );

  // Each artist gets ONLY their own half.
  const secrets: Record<string, unknown> = {};
  secrets[artistIds[0]] = { role: 'artist', part: combo.partA };
  secrets[artistIds[1]] = { role: 'artist', part: combo.partB };
  for (const id of guesserIds) secrets[id] = { role: 'guesser' };

  await db()
    .ref()
    .update({
      [`playerSecrets/${roomId}/${gameId}`]: secrets,
      // Both halves together are the answer, so they cannot sit on a node the
      // guessers — or either artist — can read.
      [gameSecretPath(roomId, gameId)]: {
        partA: combo.partA,
        partB: combo.partB,
        full: combo.full,
      },
      [`rooms/${roomId}/status`]: 'playing',
      [`rooms/${roomId}/usedWords/${gameId}`]: combo.full,
      [`rooms/${roomId}/lastArtistPair`]: artistIds,
      [`games/${roomId}/current`]: {
        gameId,
        mode: 'mushtarak',
        phase: 'brief',
        phaseEndsAt: Date.now() + MUSHTARAK.briefMs,
        artistIds,
        guesserIds,
        // activeDrawers is what the stroke security rule checks — this is the
        // one mode where more than one player may write strokes at once.
        activeDrawers: Object.fromEntries(artistIds.map((id) => [id, true])),
      },
    });

  return { gameId };
}

export async function advanceMushtarak(uid: string, data: RequestData): Promise<unknown> {

  const roomId = String(data.roomId ?? '');
  const action = String(data.action ?? '');

  const gameRef = db().ref(`games/${roomId}/current`);
  const game = (await gameRef.get()).val();
  if (!game) throw new GameError('failed-precondition', 'ما في جولة شغّالة.');

  switch (action) {
    case 'beginDrawing': {
      if (game.phase !== 'brief') return { phase: game.phase };
      const duration = game.isDuo ? (game.turnMs ?? MUSHTARAK.duo.turnMs) : MUSHTARAK.drawMs;
      await gameRef.update({ phase: 'draw', phaseEndsAt: Date.now() + duration });
      return { phase: 'draw' };
    }

    case 'gotYou': {
      if (game.phase !== 'draw' || game.isDuo) return { phase: game.phase };
      if (!(game.artistIds ?? []).includes(uid)) {
        throw new GameError('permission-denied', 'للرسّامين فقط.');
      }

      const used: string[] = Object.keys(game.gotYouUsedBy ?? {});
      if (used.includes(uid)) {
        throw new GameError('failed-precondition', 'استخدمتها.');
      }

      await gameRef.update({
        [`gotYouUsedBy/${uid}`]: true,
        gotYouFrom: uid,
        gotYouAt: ServerValue.TIMESTAMP,
      });
      return { sent: true };
    }

    // Duo only: one short turn ends and either the next player's turn begins,
    // or — once every swap has happened — both players go to the guess phase
    // to name each other's half.
    case 'endTurn': {
      if (game.phase !== 'draw' || !game.isDuo) return { phase: game.phase };

      const expected = data.turnIndex;
      if (typeof expected === 'number' && expected !== game.turnIndex) {
        return { phase: game.phase };
      }

      const artistIds: string[] = game.artistIds ?? [];
      const totalSwaps = game.totalSwaps ?? MUSHTARAK.duo.totalSwaps;
      const turnMs = game.turnMs ?? MUSHTARAK.duo.turnMs;
      const nextIndex = (game.turnIndex ?? 0) + 1;

      if (nextIndex >= totalSwaps) {
        await gameRef.update({
          phase: 'guess',
          phaseEndsAt: Date.now() + MUSHTARAK.duo.guessMs,
          currentPlayerId: null,
          // Nobody may draw once guessing starts.
          activeDrawers: null,
        });
        return { phase: 'guess' };
      }

      await gameRef.update({
        turnIndex: nextIndex,
        currentPlayerId: artistIds[nextIndex % 2],
        phaseEndsAt: Date.now() + turnMs,
      });
      return { phase: 'draw' };
    }

    case 'endDrawing': {
      if (game.phase !== 'draw' || game.isDuo) return { phase: game.phase };
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

      const artistIds: string[] = game.artistIds ?? [];
      const text = String(data.guess ?? '').slice(0, 60);
      const secret = await readGameSecret<MushtarakSecret>(roomId, game.gameId);

      /*
       * Duo inverts who guesses. In the group ruleset the two artists are the
       * only players who may NOT guess; here they are the only two players
       * there are, and each is judged against their PARTNER's half — the one
       * thing they were never told.
       */
      let correct: boolean;
      if (game.isDuo) {
        const index = artistIds.indexOf(uid);
        if (index === -1) throw new GameError('permission-denied', 'أنت مو في هذي الجولة.');
        const partnersHalf = index === 0 ? secret.partB : secret.partA;
        correct = isCorrectGuess(text, partnersHalf);
      } else {
        if (artistIds.includes(uid)) {
          throw new GameError('permission-denied', 'الرسّام ما يخمّن.');
        }
        correct = isCorrectGuess(text, secret.full);
      }

      await db().ref(`guesses/${roomId}/${game.gameId}`).push({
        playerId: uid,
        text,
        correct,
        at: ServerValue.TIMESTAMP,
      });
      return { correct };
    }

    case 'toReveal': {
      if (game.phase !== 'guess') return { phase: game.phase };

      const secret = await readGameSecret<MushtarakSecret>(roomId, game.gameId);
      const raw = (await db().ref(`guesses/${roomId}/${game.gameId}`).get()).val() ?? {};
      const correctIds = [
        ...new Set(
          Object.values(raw as Record<string, { playerId: string; correct?: boolean }>)
            .filter((g) => g.correct)
            .map((g) => g.playerId),
        ),
      ];

      const artistIds: string[] = game.artistIds ?? [];
      const delta = game.isDuo
        ? scoreMushtarakDuoRound({
            artistIds: artistIds as [string, string],
            correctByArtist: [
              correctIds.includes(artistIds[0] as string),
              correctIds.includes(artistIds[1] as string),
            ],
          })
        : scoreMushtarakRound({ artistIds, correctGuesserIds: correctIds });
      const current = ((await db().ref(`playerScores/${roomId}`).get()).val() ?? {}) as Record<
        string,
        number
      >;

      const updates: Record<string, unknown> = {
        [`games/${roomId}/current/phase`]: 'reveal',
        [`games/${roomId}/current/phaseEndsAt`]: null,
        [`games/${roomId}/current/correctGuesserIds`]: correctIds,
        // Published now, and only now: the reveal screen shows both halves and
        // the phrase they were supposed to add up to.
        [`games/${roomId}/current/partA`]: secret.partA,
        [`games/${roomId}/current/partB`]: secret.partB,
        [`games/${roomId}/current/full`]: secret.full,
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

    case 'toResult': {
      if (game.phase !== 'reveal') return { phase: game.phase };
      await gameRef.update({ phase: 'result' });
      return { phase: 'result' };
    }

    default:
      throw new GameError('invalid-argument', `إجراء غير معروف: ${action}`);
  }
}
