import { afterEach, describe, expect, it, vi } from 'vitest';
import { describeFirebaseFailure, usingEmulators } from './firebase';

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

/**
 * Four setup steps can each be skipped, and all four fail at the same moment —
 * the first time anyone creates a room. Only the cause differs, so only the
 * cause is worth printing.
 */
describe('describeFirebaseFailure', () => {
  function withCode(code: string, message = 'firebase error') {
    return Object.assign(new Error(message), { code });
  }

  it('names the missing sign-in provider', () => {
    expect(describeFirebaseFailure(withCode('auth/operation-not-allowed'))).toContain('Anonymous');
  });

  it('names the unauthorized domain', () => {
    expect(describeFirebaseFailure(withCode('auth/unauthorized-domain'))).toContain(
      'Authorized domains',
    );
  });

  it('recognises a rules refusal, which arrives as a message not a code', () => {
    const denied = new Error('PERMISSION_DENIED: Permission denied');
    expect(describeFirebaseFailure(denied)).toContain('Rules');
  });

  it('admits ignorance rather than guessing wrong — but shows the code', () => {
    /*
     * A confident pointer at the wrong console page costs more than a shrug.
     * The shrug still has to carry the code: without it, an unrecognised
     * failure reaches me as a screenshot of a sentence that says nothing, and
     * the one identifying fact stays on the player's device.
     */
    const message = describeFirebaseFailure(withCode('auth/internal-error'));

    expect(message).toContain('صار خطأ');
    expect(message).toContain('auth/internal-error');
  });

  it('falls back to the raw message when there is no code', () => {
    expect(describeFirebaseFailure(new Error('maxretry'))).toContain('maxretry');
  });
});
