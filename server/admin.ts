/**
 * The Admin SDK, initialised for whichever host is running this code.
 *
 * The trusted logic runs in two places and must not care which:
 *
 *   - a Vercel serverless function, which has no ambient Google credentials and
 *     is handed a service account through the environment;
 *   - the Firebase Functions emulator, which supplies credentials itself.
 *
 * So initialisation is lazy and picks its credential from what is present.
 * Everything else in `server/` imports `db()` and never touches this again.
 */

import * as admin from 'firebase-admin';

let started = false;

function start(): void {
  if (started || admin.apps.length > 0) {
    started = true;
    return;
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  const databaseURL = process.env.FIREBASE_DATABASE_URL;

  if (serviceAccount) {
    /*
     * The key arrives as JSON in one environment variable. Its private key
     * contains real newlines, which some dashboards turn into the two
     * characters `\` and `n` on the way in; both spellings are accepted here so
     * a paste that looks identical does not fail with an unreadable PEM error.
     */
    const parsed = JSON.parse(serviceAccount) as { private_key?: string };
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
      credential: admin.credential.cert(parsed as admin.ServiceAccount),
      ...(databaseURL ? { databaseURL } : {}),
    });
  } else {
    // Firebase-hosted: credentials and database URL come from the environment.
    admin.initializeApp();
  }

  started = true;
}

export function db(): admin.database.Database {
  start();
  return admin.database();
}

export function auth(): admin.auth.Auth {
  start();
  return admin.auth();
}

export { ServerValue } from 'firebase-admin/database';
