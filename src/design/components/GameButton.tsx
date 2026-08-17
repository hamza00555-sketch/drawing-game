import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * The primary action control.
 *
 * Buttons in وش ذا؟ are physical objects, not rectangles: they sit on a hard
 * ink shadow and travel down into it when pressed, so the press has depth
 * rather than a colour change. The shape is built in code — that is functional
 * UI. Anything illustrative inside one comes from Higgsfield.
 *
 * The press effect is CSS-only (translate + shadow swap) so it stays on the
 * compositor and cannot cost a frame while a canvas is live.
 */

export type ButtonTone = 'primary' | 'secondary' | 'quiet' | 'danger';
export type ButtonSize = 'lg' | 'md' | 'sm';

export interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone;
  size?: ButtonSize;
  /** Stretches to the container. Default for primary actions on mobile. */
  block?: boolean;
  children: ReactNode;
}

const TONE: Record<ButtonTone, string> = {
  primary: 'bg-cobalt text-paper border-ink',
  secondary: 'bg-mustard text-ink border-ink',
  quiet: 'bg-paper-raised text-ink border-ink',
  danger: 'bg-tomato-deep text-paper border-ink',
};

const SIZE: Record<ButtonSize, string> = {
  // min-h-tap keeps every button at or above the 48px touch target.
  lg: 'min-h-tap px-6 py-3 text-xl rounded-lg',
  md: 'min-h-tap px-5 py-2 text-lg rounded-md',
  sm: 'min-h-tap px-4 py-2 text-base rounded-md',
};

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
        'inline-flex items-center justify-center gap-2 border-bold font-display',
        'transition-[transform,box-shadow] duration-instant ease-bounce',
        'shadow-2 active:translate-y-[3px] active:shadow-pressed',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-1',
        'disabled:active:translate-y-0 disabled:active:shadow-1',
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
