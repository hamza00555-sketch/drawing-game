import { useEffect, useState } from 'react';
import { DRAWING_DEFAULTS, DRAWING_TUNABLES, resolveSettings } from '../../shared/tunables';
import { watchRoomSettings } from './room';

/**
 * The room's pen and eraser thickness.
 *
 * Read straight from `rooms/{roomId}/settings/drawing` rather than passed down
 * through every mode container, because it is the same two numbers for every
 * mode and every screen — threading them through five containers would be
 * five chances to forget one.
 *
 * Clamped through the same `resolveSettings` the server uses, so a hand-edited
 * settings node cannot produce a zero-width pen or a rubber the size of the
 * canvas.
 */
export function useDrawingWidths(roomId: string): typeof DRAWING_DEFAULTS {
  const [widths, setWidths] = useState<typeof DRAWING_DEFAULTS>(DRAWING_DEFAULTS);

  useEffect(() => {
    return watchRoomSettings(roomId, (settings) => {
      setWidths(
        resolveSettings(DRAWING_DEFAULTS, settings.drawing, DRAWING_TUNABLES),
      );
    });
  }, [roomId]);

  return widths;
}
