/**
 * Pen colours, as literal hex.
 *
 * These CANNOT be CSS custom properties. A canvas 2D context resolves
 * `strokeStyle` itself and knows nothing about the cascade, so assigning
 * `var(--wt-pen-artist)` is simply an invalid value — the context silently
 * keeps whatever colour it had, and every player draws in the previous stroke's
 * colour. On a shared canvas that destroys the one thing the colours exist for:
 * telling contributions apart.
 *
 * `tokens.css` mirrors these for CSS-side use (swatches, legends). This file is
 * the source of truth; if you change one, change both.
 *
 * Values are deliberately darker than each character's body colour: a stroke
 * has to stay legible as a thin line on the near-white canvas.
 */

export const PEN_COLORS = {
  artist: '#d83f24',
  critic: '#d89a1e',
  confused: '#1f9455',
  excited: '#1d3eb0',
  innocent: '#d34a85',
  detective: '#5b4fa8',
  confident: '#6b9e2a',
  dramatic: '#d96a1f',
  calm: '#6b7a94',
  trickster: '#805333',
} as const satisfies Record<string, string>;

export type PenColorKey = keyof typeof PEN_COLORS;

/** Default ink for canvases with no per-player colouring. */
export const DEFAULT_PEN = '#151515';

/**
 * A player's pen, from the character they chose.
 *
 * Character reservations are unique per room, so this is also what makes each
 * pen on a shared canvas unique — the colour is a consequence of the identity,
 * not a separate thing to allocate and keep in sync.
 */
export function penColorFor(characterId: string | undefined): string {
  if (!characterId) return DEFAULT_PEN;
  return PEN_COLORS[characterId as PenColorKey] ?? DEFAULT_PEN;
}
