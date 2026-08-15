import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth } from '../server/admin.js';
import { GameError, STATUS } from '../server/errors.js';
import { resolve } from '../server/router.js';

/**
 * The trusted logic, served from Vercel.
 *
 * Firebase remains the backend — Auth issues the identity, Realtime Database
 * holds the state, and the security rules police every client write. What lives
 * here is only the code that must run somewhere a player cannot reach, because
 * whoever assigns the roles knows them: if a player's device picked the
 * impostor, that player would know who it was.
 *
 * Identity comes from the Firebase ID token the browser already holds, verified
 * here with the Admin SDK. That is exactly what a Cloud Function's `onCall`
 * does; only the transport differs.
 *
 * Requires two environment variables, both server-side only:
 *   FIREBASE_SERVICE_ACCOUNT  the service account JSON, whole
 *   FIREBASE_DATABASE_URL     the Realtime Database URL
 */

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'استخدم POST.' });
    return;
  }

  try {
    const header = String(request.headers.authorization ?? '');
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';

    if (!token) {
      throw new GameError('unauthenticated', 'سجّل دخول أولاً.');
    }

    /*
     * `verifyIdToken` checks the signature, the audience and the expiry against
     * Google's published keys. A forged or stale token cannot pass, so `uid`
     * below is as trustworthy as `request.auth.uid` inside a Cloud Function —
     * and every handler's permission check is built on it.
     */
    const { uid } = await auth().verifyIdToken(token);

    const body = (typeof request.body === 'string' ? JSON.parse(request.body) : request.body) ?? {};
    const { fn, ...data } = body as Record<string, unknown>;

    const result = await resolve(fn)(uid, data);
    response.status(200).json({ result: result ?? null });
  } catch (error) {
    if (error instanceof GameError) {
      // Our own refusals are written for the player and are safe to show.
      response.status(STATUS[error.code]).json({ error: error.message, code: error.code });
      return;
    }

    // Anything else is ours to fix, and its text is not for a player to read.
    console.error('game handler failed', error);
    response.status(500).json({ error: 'صار خطأ في الخادم.', code: 'internal' });
  }
}
