/**
 * وش ذا؟ — which modes are in rotation right now.
 *
 * Hiding a mode is deliberately NOT deletion. كمّل رسمتي، الرسم المشترك and
 * كانت إيش؟ keep every line they have — machines, screens, server handlers,
 * security rules, tests, tunables — they simply do not appear anywhere a
 * player can reach: not in mode selection, not in the "قريبًا" strip, not as a
 * settings section, and not as something the lobby will start.
 *
 * So bringing one back is deleting its line from the list below and nothing
 * else, and the tests that cover those modes keep running in the meantime so
 * they cannot rot while they are out.
 */

import type { GameMode } from '../engine/room';

export const HIDDEN_MODES: readonly GameMode[] = ['kammil', 'mushtarak', 'kanatEsh'];

/**
 * True for a mode players may currently see and start.
 *
 * Takes `undefined` too, because the caller usually holds a room's stored
 * `currentMode` — which may name a mode that was in rotation when it was
 * written and is not any more.
 */
export function isModeAvailable(mode: GameMode | undefined): mode is GameMode {
  return mode !== undefined && !HIDDEN_MODES.includes(mode);
}
