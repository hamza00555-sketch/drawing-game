/**
 * How the trusted logic refuses.
 *
 * The handlers used to throw Firebase's `HttpsError`, which tied them to one
 * transport. `GameError` carries the same information — a machine code and a
 * message written for the player, in Arabic — and each transport maps it to
 * whatever shape it speaks: an HTTP status on Vercel, an `HttpsError` in a
 * Cloud Function.
 *
 * The message is always safe to show. That is a deliberate contract: a refusal
 * the player caused ("مو دورك") should read as an explanation, not an error.
 */

export type GameErrorCode =
  | 'unauthenticated'
  | 'permission-denied'
  | 'invalid-argument'
  | 'failed-precondition'
  | 'internal';

export class GameError extends Error {
  constructor(readonly code: GameErrorCode, message: string) {
    super(message);
    this.name = 'GameError';
  }
}

/** HTTP status per code, for the Vercel transport. */
export const STATUS: Record<GameErrorCode, number> = {
  unauthenticated: 401,
  'permission-denied': 403,
  'invalid-argument': 400,
  'failed-precondition': 409,
  internal: 500,
};
