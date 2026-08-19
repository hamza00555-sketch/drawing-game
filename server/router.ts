/**
 * The whole trusted surface, in one map.
 *
 * Every entry decides something a player must not be trusted to decide: who the
 * impostor is, what the word is, when a phase ends, who scored. Anything a
 * player legitimately owns — a stroke, a vote, their own presence — is written
 * straight to the database under security rules and is deliberately absent
 * here, because a round trip through a serverless function on a two-second
 * turn is a cost the game cannot pay.
 *
 * A single map rather than a function per action is also a hosting constraint:
 * Vercel's Hobby plan allows twelve serverless functions per deployment and
 * there are fourteen actions, so they share one endpoint and route by name.
 */

import { GameError } from './errors.js';
import type { RequestData } from './types.js';

import { startMozawwerRound, advanceMozawwer, returnToLobby } from './index.js';
import { startKammilRound, advanceKammil } from './kammil.js';
import {
  startMamnouRound,
  beginMamnouDrawing,
  submitMamnouGuess,
  endMamnouRound,
} from './mamnou3at.js';
import { startMushtarakRound, advanceMushtarak } from './mushtarak.js';
import {
  startKanatEshRound,
  submitKanatEshLink,
  submitKanatEshLinkDuo,
  kanatEshToResult,
} from './kanatEsh.js';

export type Handler = (uid: string, data: RequestData) => Promise<unknown>;

export const HANDLERS = {
  startMozawwerRound,
  advanceMozawwer,
  returnToLobby,

  startKammilRound,
  advanceKammil,

  startMamnouRound,
  beginMamnouDrawing,
  submitMamnouGuess,
  endMamnouRound,

  startMushtarakRound,
  advanceMushtarak,

  startKanatEshRound,
  submitKanatEshLink,
  submitKanatEshLinkDuo,
  kanatEshToResult,
} as const satisfies Record<string, Handler>;

export type HandlerName = keyof typeof HANDLERS;

/**
 * Look up a handler by the name a client asked for.
 *
 * The name arrives from the network, so it is checked against the map rather
 * than used to index it — an unknown name is a refusal, never a crash.
 */
export function resolve(name: unknown): Handler {
  const handler = (HANDLERS as Record<string, Handler>)[String(name)];
  if (!handler) {
    throw new GameError('invalid-argument', `إجراء غير معروف: ${String(name)}`);
  }
  return handler;
}
