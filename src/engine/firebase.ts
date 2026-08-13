/**
 * Firebase bootstrap — the only module that touches the SDK's initialisation.
 *
 * Everything else in the engine imports `getDb()` / `getCurrentUid()` from here.
 * Initialisation is lazy so that the splash screen paints before the Firebase
 * chunk is parsed, and so that unit tests can run without any config present.
 */

import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  connectAuthEmulator,
  type Auth,
  type User,
} from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator, type Database } from 'firebase/database';

export class FirebaseConfigError extends Error {
  readonly missing: readonly string[];

  constructor(missing: readonly string[]) {
    super(
      `إعدادات Firebase ناقصة: ${missing.join(', ')}. ` +
        'انسخ .env.example إلى .env.local وعبّئ القيم من Firebase Console.',
    );
    this.name = 'FirebaseConfigError';
    this.missing = missing;
  }
}

const REQUIRED_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_DATABASE_URL',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

function readConfig(): FirebaseOptions {
  const env = import.meta.env as unknown as Record<string, string | undefined>;

  const missing = REQUIRED_KEYS.filter((key) => {
    const value = env[key];
    return value === undefined || value.trim() === '';
  });

  if (missing.length > 0) {
    throw new FirebaseConfigError(missing);
  }

  // Required keys are proven present above. Optional ones are only included
  // when set — under `exactOptionalPropertyTypes` an explicit `undefined` is
  // not the same as an absent key.
  const config: FirebaseOptions = {
    apiKey: env.VITE_FIREBASE_API_KEY as string,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string,
    databaseURL: env.VITE_FIREBASE_DATABASE_URL as string,
    projectId: env.VITE_FIREBASE_PROJECT_ID as string,
    appId: env.VITE_FIREBASE_APP_ID as string,
  };

  if (env.VITE_FIREBASE_STORAGE_BUCKET) {
    config.storageBucket = env.VITE_FIREBASE_STORAGE_BUCKET;
  }
  if (env.VITE_FIREBASE_MESSAGING_SENDER_ID) {
    config.messagingSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  }

  return config;
}

/** True when the app should talk to `npm run emulators` instead of the cloud. */
export function usingEmulators(): boolean {
  const env = import.meta.env as unknown as Record<string, string | undefined>;
  return env.VITE_USE_FIREBASE_EMULATORS === 'true';
}

/** True when enough config exists to boot. Lets the UI show a setup screen. */
export function isFirebaseConfigured(): boolean {
  try {
    readConfig();
    return true;
  } catch {
    return false;
  }
}

let app: FirebaseApp | undefined;
let db: Database | undefined;
let auth: Auth | undefined;
let emulatorsConnected = false;

function getApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(readConfig());
  }
  return app;
}

export function getDb(): Database {
  if (!db) {
    db = getDatabase(getApp());
    if (usingEmulators() && !emulatorsConnected) {
      connectDatabaseEmulator(db, '127.0.0.1', 9000);
    }
  }
  return db;
}

export function getAuthInstance(): Auth {
  if (!auth) {
    auth = getAuth(getApp());
    if (usingEmulators() && !emulatorsConnected) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      emulatorsConnected = true;
    }
  }
  return auth;
}

let signInPromise: Promise<User> | undefined;

/**
 * Sign in anonymously, once per session.
 *
 * Every rule in `database.rules.json` keys off `auth.uid`, so nothing in the
 * game may run before this resolves. Concurrent callers share one promise so a
 * burst of engine modules booting together cannot trigger multiple sign-ins.
 */
export function ensureSignedIn(): Promise<User> {
  if (signInPromise) return signInPromise;

  signInPromise = new Promise<User>((resolve, reject) => {
    const instance = getAuthInstance();

    if (instance.currentUser) {
      resolve(instance.currentUser);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      instance,
      (user) => {
        if (user) {
          unsubscribe();
          resolve(user);
        }
      },
      (error) => {
        unsubscribe();
        reject(error);
      },
    );

    signInAnonymously(instance).catch((error: unknown) => {
      unsubscribe();
      reject(error instanceof Error ? error : new Error(String(error)));
    });
  });

  // A failed sign-in must not poison the session permanently — let the next
  // caller retry (for example after the player regains connectivity).
  signInPromise.catch(() => {
    signInPromise = undefined;
  });

  return signInPromise;
}

/** The signed-in player's id, or undefined before `ensureSignedIn()` resolves. */
export function getCurrentUid(): string | undefined {
  return getAuthInstance().currentUser?.uid;
}

/** Throws if called before sign-in. Use inside code that runs post-auth. */
export function requireUid(): string {
  const uid = getCurrentUid();
  if (!uid) {
    throw new Error('requireUid() called before ensureSignedIn() resolved.');
  }
  return uid;
}
