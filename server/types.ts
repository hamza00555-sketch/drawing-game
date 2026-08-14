/**
 * The shape of a request to the trusted logic.
 *
 * Deliberately untyped values: this data crossed the network from a player's
 * device, so every handler coerces what it reads (`String(data.roomId ?? '')`)
 * rather than trusting a declared type. A precise interface here would be a
 * claim the transport cannot keep.
 */
export type RequestData = Record<string, unknown>;
