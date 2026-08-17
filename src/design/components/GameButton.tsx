import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * The primary action control.
 *
 * Buttons in وش ذا؟ are physical objects, not rectangles: they sit on a hard
 * ink shadow and travel down into it when pressed, so the press has depth
 * rather than a colour change. The shape (padding, size, press physics) is
 * built in code — that is functional UI. The ring and the fill are not: each
 * tone is one piece of Higgsfield art (ring and marker-scribble fill drawn
 * together, not simulated separately), applied as a 9-slice `border-image` in
 * `src/index.css` so one drawing covers any button width a label needs. See
 * ASSET_MANIFEST.md Batch 13.
 *
 * The press effect is still CSS-only (translate + shadow swap, plus a
 * `:active` brightness dip on the same artwork) so it stays on the compositor
 * and cannot cost a frame while a canvas is live — swapping to a second image
 * on press was deliberately avoided for that reason.
 */

export type ButtonTone = 'primary' | 'secondary' | 'accent' | 'danger';
export type ButtonSize = 'lg' | 'md' | 'sm';

const TONE: Record<ButtonTone, string> = {
  primary: 'wt-btn-primary text-paper',
  secondary: 'wt-btn-secondary text-ink',
  accent: 'wt-btn-accent text-ink',
  danger: 'wt-btn-danger text-paper',
};

const SIZE: Record<ButtonSize, string> = {
  // min-h-tap keeps every button at or above the 48px touch target.
  lg: 'min-h-tap px-6 py-3 text-xl wt-btn-lg',
  md: 'min-h-tap px-5 py-2 text-lg wt-btn-md',
  sm: 'min-h-tap px-4 py-2 text-base wt-btn-sm',
};

export interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone;
  size?: ButtonSize;
  /** Stretches to the container. Default for primary actions on mobile. */
  block?: boolean;
  children: ReactNode;
}

export function GameButton({
  tone = 'primary',
  size = 'md',
  block = false,
  className = '',
  disabled,
  children,
  ...rest
}: GameButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-md border-ink font-display',
        'transition-[transform,box-shadow,filter] duration-instant ease-bounce',
        'shadow-2 active:translate-y-[3px] active:shadow-pressed active:brightness-90',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-1',
        'disabled:active:translate-y-0 disabled:active:shadow-1 disabled:active:brightness-100',
        TONE[tone],
        SIZE[size],
        block ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}
