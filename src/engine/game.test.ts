import { describe, expect, it } from 'vitest';
import { describeCallFailure } from './game';

/**
 * The distinction these tests protect: "the server said no" versus "there is no
 * server".
 *
 * The trusted logic is reached over HTTP now, so a failure can arrive as a
 * status code, as a fetch that never landed, or as a refusal the server wrote
 * on purpose. Only the last one is worth showing verbatim, and it is
 * recognisable by being written in Arabic — nothing a transport invents is.
 */

class CallableError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
  }
}

describe('describeCallFailure', () => {
  it('passes our own refusals through untouched', () => {
    // These are written in the handlers, in Arabic, for the player to read.
    for (const message of ['مو دورك.', 'نحتاج 3 لاعبين على الأقل.', 'المضيف فقط.']) {
      const failure = describeCallFailure(new CallableError('permission-denied', message));

      expect(failure.message).toBe(message);
      expect(failure.functionsMissing).toBe(false);
    }
  });

  it('recognises an endpoint that is not there', () => {
    // 404 on /api/game means it was never deployed, or a rewrite ate it.
    const failure = describeCallFailure(new CallableError('http/404', 'HTTP 404'));

    expect(failure.functionsMissing).toBe(true);
    expect(failure.message).toContain('/api/game');
  });

  it('sends a server crash to the server log, not the player', () => {
    const failure = describeCallFailure(new CallableError('http/500', 'HTTP 500'));

    expect(failure.functionsMissing).toBe(false);
    expect(failure.message).toContain('Vercel');
  });

  it('treats a request that never landed as a connection problem', () => {
    // fetch() rejects with a TypeError and no code.
    const failure = describeCallFailure(new TypeError('Failed to fetch'));

    expect(failure.functionsMissing).toBe(false);
    expect(failure.message).toContain('الاتصال');
  });

  it('does not blame deployment for an error the handler raised itself', () => {
    // Same transport, but the message is ours — the endpoint clearly exists.
    const failure = describeCallFailure(new CallableError('http/500', 'تعذّر اختيار كلمة.'));

    expect(failure.functionsMissing).toBe(false);
    expect(failure.message).toBe('تعذّر اختيار كلمة.');
  });

  it('shows an unrecognised code rather than hiding it', () => {
    expect(describeCallFailure(new CallableError('http/418', 'teapot')).message).toContain(
      'http/418',
    );
  });
});
