/**
 * Cloud Functions wrappers — kept for the local emulator, not for deployment.
 *
 * The trusted logic lives in `server/` and is served in production by a Vercel
 * serverless function, because Cloud Functions require the Blaze plan and this
 * project runs on Spark. Firebase is still the backend: Auth issues the
 * identity, Realtime Database holds the state, the rules police every write.
 *
 * These wrappers exist so `npm run emulators` can still run the whole game
 * locally, end to end, against the SAME handlers. There is no second copy of
 * the logic here — that is the point. A copy would drift, and a scoring rule
 * that differs between transports reads to players as the game lying.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { HANDLERS, type HandlerName } from '../../server/router';
import { GameError } from '../../server/errors';

/** Map our transport-neutral refusals onto the callable protocol. */
function wrap(name: HandlerName) {
  return onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'سجّل دخول أولاً.');

    try {
      const result = await HANDLERS[name](uid, (request.data ?? {}) as Record<string, unknown>);
      return result ?? null;
    } catch (error) {
      if (error instanceof GameError) throw new HttpsError(error.code, error.message);
      throw error;
    }
  });
}

// Named exports, one per action: Firebase discovers deployable functions by
// reading this module's exports, so they cannot be generated in a loop.
export const startMozawwerRound = wrap('startMozawwerRound');
export const advanceMozawwer = wrap('advanceMozawwer');
export const returnToLobby = wrap('returnToLobby');

export const startKammilRound = wrap('startKammilRound');
export const advanceKammil = wrap('advanceKammil');

export const startMamnouRound = wrap('startMamnouRound');
export const beginMamnouDrawing = wrap('beginMamnouDrawing');
export const submitMamnouGuess = wrap('submitMamnouGuess');
export const endMamnouRound = wrap('endMamnouRound');

export const startMushtarakRound = wrap('startMushtarakRound');
export const advanceMushtarak = wrap('advanceMushtarak');

export const startKanatEshRound = wrap('startKanatEshRound');
export const submitKanatEshLink = wrap('submitKanatEshLink');
export const submitKanatEshLinkDuo = wrap('submitKanatEshLinkDuo');
export const kanatEshToResult = wrap('kanatEshToResult');
