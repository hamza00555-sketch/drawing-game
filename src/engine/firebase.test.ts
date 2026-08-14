import { afterEach, describe, expect, it, vi } from 'vitest';
import { usingEmulators } from './firebase';

/**
 * The mistake these tests exist to make harmless.
 *
 * `VITE_USE_FIREBASE_EMULATORS=true` belongs in `.env.local` on a developer's
 * machine. It reaches a hosting provider's environment variables easily — one
 * "import .env" and it is there — and the consequence is a public site that
 * points every visitor's browser at 127.0.0.1, their own machine, where nothing
 * is listening. The game simply never connects, and nothing on screen says why.
 *
 * The page's origin is the check that cannot be got wrong by configuration.
 */

function setFlag(value: string | undefined): void {
  vi.stubEnv('VITE_USE_FIREBASE_EMULATORS', value as string);
}

function setHostname(hostname: string): void {
  vi.stubGlobal('location', { hostname });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('usingEmulators', () => {
  it('is off unless explicitly asked for', () => {
    setHostname('localhost');
    setFlag(undefined);
    expect(usingEmulators()).toBe(false);

    setFlag('false');
    expect(usingEmulators()).toBe(false);
  });

  it('is on when developing locally', () => {
    setFlag('true');

    for (const hostname of ['localhost', '127.0.0.1']) {
      setHostname(hostname);
      expect(usingEmulators()).toBe(true);
    }
  });

  it('refuses on a deployed site even when the flag says otherwise', () => {
    setFlag('true');

    for (const hostname of ['drawing-game.vercel.app', 'wesh-tha.com']) {
      setHostname(hostname);
      expect(usingEmulators()).toBe(false);
    }
  });

  it('only ever accepts the exact string "true"', () => {
    setHostname('localhost');

    for (const value of ['TRUE', '1', 'yes', ' true']) {
      setFlag(value);
      expect(usingEmulators()).toBe(false);
    }
  });
});
