/**
 * Server-synchronised clock.
 *
 * WHY THIS EXISTS: كمّل رسمتي gives each artist a 3-second countdown followed by
 * as little as 2 seconds of drawing. If every device counted with its own
 * `Date.now()`, a phone whose clock is half a second fast would cut its player's
 * turn by a fifth. Device clocks are also routinely minutes off.
 *
 * So no timer in this game reads `Date.now()` directly. Phase deadlines are
 * written server-side as `ServerValue.TIMESTAMP` into `phaseEndsAt`, and every
 * client converts that to local time through the offset Firebase measures on
 * `.info/serverTimeOffset`.
 */

import { onValue, ref } from 'firebase/database';
import { getDb } from './firebase';
import { paths } from './paths';

let offsetMs = 0;
let subscribed = false;
const listeners = new Set<(offset: number) => void>();

/**
 * Begin tracking clock skew. Idempotent, and safe to call before sign-in —
 * `.info/*` is readable without auth.
 *
 * Returns an unsubscribe function, though in practice the app keeps this alive
 * for the whole session.
 */
export function startClockSync(): () => void {
  if (subscribed) return () => undefined;
  subscribed = true;

  const offsetRef = ref(getDb(), paths.infoServerTimeOffset);

  return onValue(offsetRef, (snapshot) => {
    const value = snapshot.val();
    if (typeof value === 'number' && Number.isFinite(value)) {
      offsetMs = value;
      for (const listener of listeners) listener(offsetMs);
    }
  });
}

/** Current best estimate of the server clock, in ms since epoch. */
export function serverNow(): number {
  return Date.now() + offsetMs;
}

/** The measured skew. Exposed mainly for diagnostics and tests. */
export function getClockOffsetMs(): number {
  return offsetMs;
}

/**
 * Milliseconds remaining until a server-stamped deadline, floored at zero.
 * This is the ONLY correct way to ask "how long is left in this phase".
 */
export function msUntil(serverDeadlineMs: number | null | undefined): number {
  if (typeof serverDeadlineMs !== 'number') return 0;
  return Math.max(0, serverDeadlineMs - serverNow());
}

/** Test seam: lets unit tests simulate a skewed device without Firebase. */
export function __setClockOffsetForTests(value: number): void {
  offsetMs = value;
}

export function onClockOffsetChange(listener: (offset: number) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
