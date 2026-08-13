import type { ReactNode } from 'react';

/**
 * Screen shell.
 *
 * Owns the things every full screen must get right and none should re-solve:
 * the paper ground, safe-area insets, the reading-width cap, and a footer that
 * stays reachable with one thumb rather than floating in the middle of a tall
 * phone.
 *
 * Layout is written with logical properties throughout, so RTL is the natural
 * behaviour of the layout rather than a mirrored patch applied afterwards.
 */

export interface ScreenProps {
  children: ReactNode;
  /** Pinned to the bottom, above the safe area. Primary actions live here. */
  footer?: ReactNode;
  /** Centres content vertically. For short screens like Splash and Home. */
  center?: boolean;
  className?: string;
}

export function Screen({ children, footer, center = false, className = '' }: ScreenProps) {
  return (
    <div className="wt-screen wt-paper-ground">
      <div
        className={[
          'mx-auto flex w-full max-w-content flex-1 flex-col',
          center ? 'justify-center' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>

      {footer && (
        <div className="mx-auto w-full max-w-content pt-4">
          <div className="flex flex-col gap-3">{footer}</div>
        </div>
      )}
    </div>
  );
}
