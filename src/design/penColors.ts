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
  artist: '#d13d24',
  critic: '#c98a1c',
  confused: '#1c7269',
  excited: '#27499b',
  innocent: '#b2436c',
  detective: '#5c3b9b',
  confident: '#5c7d27',
  dramatic: '#a8541a',
  calm: '#566876',
  trickster: '#653f28',
} as const satisfies Record<string, string>;

export type PenColorKey = keyof typeof PEN_COLORS;

/** Default ink for canvases with no per-player colouring. */
export const DEFAULT_PEN = '#2a211c';
