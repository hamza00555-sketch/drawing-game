import { describe, expect, it } from 'vitest';
import { describeCallFailure } from './game';

/**
 * The distinction these tests protect: "the server said no" versus "there is no
 * server".
 *
 * On the free Spark plan the second case is the normal one — Cloud Functions
 * cannot be deployed without Blaze — and it surfaces as an SDK string like
 * "NOT FOUND", which tells a host nothing about why the round will not start.
 */

class CallableError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
  }
}

describe('describeCallFailure', () => {
  it('passes our own refusals through untouched', () => {
    // These are written in the functions, in Arabic, for the player to read.
    for (const message of ['مو دورك.', 'نحتاج 3 لاعبين على الأقل.', 'المضيف فقط.']) {
      const failure = describeCallFailure(
        new CallableError('functions/permission-denied', message),
      );

      expect(failure.message).toBe(message);
      expect(failure.functionsMissing).toBe(false);
    }
  });

  it('recognises trusted logic that was never deployed', () => {
    const failure = describeCallFailure(new CallableError('functions/not-found', 'NOT FOUND'));

    expect(failure.functionsMissing).toBe(true);
    expect(failure.message).toContain('Cloud Functions');
  });

  it('names both readings of an opaque internal error', () => {
    /*
     * `internal` is what a CORS-blocked call to a missing function looks like
     * from the page, and also what a deployed function that threw looks like.
     * Committing to "not deployed" here once sent me hunting the wrong cause
     * while a real crash sat in the emulator log, so the message says both.
     */
    const failure = describeCallFailure(new CallableError('functions/internal', 'internal'));

    expect(failure.functionsMissing).toBe(false);
    expect(failure.message).toContain('ما نشرته');
    expect(failure.message).toContain('سجل');
  });

  it('does not blame deployment for an internal error we raised ourselves', () => {
    // Same code, but the message is ours — the functions clearly exist.
    const failure = describeCallFailure(
      new CallableError('functions/internal', 'تعذّر اختيار كلمة.'),
    );

    expect(failure.functionsMissing).toBe(false);
    expect(failure.message).toBe('تعذّر اختيار كلمة.');
  });

  it('falls back to something a player can act on', () => {
    const failure = describeCallFailure(new CallableError('functions/deadline-exceeded', 'timeout'));

    expect(failure.functionsMissing).toBe(false);
    expect(failure.message).toContain('الاتصال');
  });
});
