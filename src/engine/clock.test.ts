import { afterEach, describe, expect, it } from 'vitest';
import { __setClockOffsetForTests, msUntil, serverNow } from './clock';

afterEach(() => {
  __setClockOffsetForTests(0);
});

describe('serverNow', () => {
  it('applies the measured skew to the device clock', () => {
    __setClockOffsetForTests(5_000);
    expect(serverNow() - Date.now()).toBeGreaterThanOrEqual(4_900);
  });
});

describe('msUntil', () => {
  it('measures a deadline against server time, not device time', () => {
    // Simulate a device whose clock runs 10s slow. A naive Date.now() timer
    // would give this player 10 extra seconds of drawing.
    __setClockOffsetForTests(10_000);
    const deadline = Date.now() + 10_000 + 3_000;
    expect(msUntil(deadline)).toBeLessThanOrEqual(3_000);
    expect(msUntil(deadline)).toBeGreaterThan(2_500);
  });

  it('floors at zero once the deadline has passed', () => {
    expect(msUntil(Date.now() - 60_000)).toBe(0);
  });

  it('treats a missing deadline as expired rather than infinite', () => {
    expect(msUntil(null)).toBe(0);
    expect(msUntil(undefined)).toBe(0);
  });
});
