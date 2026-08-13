/**
 * Local session: who this device is playing as, and which room it is in.
 *
 * Deliberately small. Everything shared lives in the Realtime Database and is
 * read through subscriptions; this store holds only what belongs to this
 * device — the name and character chosen before joining, and the current room.
 *
 * Name and character persist to localStorage so a returning player is not asked
 * to re-enter them every game night, and so a mid-game refresh rejoins cleanly.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SessionState {
  name: string;
  characterId: string;
  variant: string;
  /**
   * Explicitly `string | undefined` rather than optional: under
   * exactOptionalPropertyTypes, clearing the room means setting undefined, and
   * an optional property cannot be assigned undefined.
   */
  roomId: string | undefined;

  setIdentity: (identity: { name: string; characterId: string; variant?: string }) => void;
  setRoomId: (roomId: string | undefined) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      name: '',
      characterId: '',
      variant: 'default',
      roomId: undefined,

      setIdentity: ({ name, characterId, variant = 'default' }) =>
        set({ name: name.trim().slice(0, 16), characterId, variant }),

      setRoomId: (roomId) => set({ roomId }),
    }),
    {
      name: 'wesh-tha-session',
      // The room id is intentionally not persisted: a stale room from last week
      // should not drag a returning player into a dead lobby.
      partialize: (state) => ({
        name: state.name,
        characterId: state.characterId,
        variant: state.variant,
      }),
    },
  ),
);

export function hasIdentity(state: Pick<SessionState, 'name' | 'characterId'>): boolean {
  return state.name.trim().length > 0 && state.characterId.length > 0;
}
