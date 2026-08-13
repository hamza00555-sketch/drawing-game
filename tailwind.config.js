/**
 * Tailwind is used strictly as a layout/utility engine bound to our tokens.
 * The default palette, default font stack and default shadows are all
 * replaced — nothing generic from Tailwind should ever reach the screen.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // `colors` replaces (not extends) the default palette on purpose.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      paper: {
        DEFAULT: 'var(--wt-paper)',
        raised: 'var(--wt-paper-raised)',
        sunken: 'var(--wt-paper-sunken)',
        canvas: 'var(--wt-paper-canvas)',
      },
      ink: {
        DEFAULT: 'var(--wt-ink)',
        soft: 'var(--wt-ink-soft)',
        faint: 'var(--wt-ink-faint)',
        hairline: 'var(--wt-ink-hairline)',
      },
      tomato: { DEFAULT: 'var(--wt-tomato)', deep: 'var(--wt-tomato-deep)' },
      mustard: { DEFAULT: 'var(--wt-mustard)', deep: 'var(--wt-mustard-deep)' },
      teal: { DEFAULT: 'var(--wt-teal)', deep: 'var(--wt-teal-deep)' },
      cobalt: { DEFAULT: 'var(--wt-cobalt)', deep: 'var(--wt-cobalt-deep)' },
      grape: { DEFAULT: 'var(--wt-grape)', deep: 'var(--wt-grape-deep)' },
      rose: { DEFAULT: 'var(--wt-rose)', deep: 'var(--wt-rose-deep)' },
    },
    fontFamily: {
      display: 'var(--wt-font-display)',
      body: 'var(--wt-font-body)',
    },
    fontSize: {
      xs: 'var(--wt-text-xs)',
      sm: 'var(--wt-text-sm)',
      base: 'var(--wt-text-base)',
      lg: 'var(--wt-text-lg)',
      xl: 'var(--wt-text-xl)',
      '2xl': 'var(--wt-text-2xl)',
      '3xl': 'var(--wt-text-3xl)',
      hero: 'var(--wt-text-hero)',
    },
    borderRadius: {
      none: '0',
      sm: 'var(--wt-radius-sm)',
      md: 'var(--wt-radius-md)',
      lg: 'var(--wt-radius-lg)',
      xl: 'var(--wt-radius-xl)',
      pill: 'var(--wt-radius-pill)',
    },
    borderWidth: {
      DEFAULT: 'var(--wt-stroke-thin)',
      0: '0',
      hair: 'var(--wt-stroke-hair)',
      thin: 'var(--wt-stroke-thin)',
      bold: 'var(--wt-stroke-bold)',
      heavy: 'var(--wt-stroke-heavy)',
    },
    boxShadow: {
      none: 'none',
      1: 'var(--wt-lift-1)',
      2: 'var(--wt-lift-2)',
      3: 'var(--wt-lift-3)',
      pressed: 'var(--wt-lift-pressed)',
    },
    extend: {
      spacing: {
        1: 'var(--wt-space-1)',
        2: 'var(--wt-space-2)',
        3: 'var(--wt-space-3)',
        4: 'var(--wt-space-4)',
        5: 'var(--wt-space-5)',
        6: 'var(--wt-space-6)',
        7: 'var(--wt-space-7)',
        8: 'var(--wt-space-8)',
        tap: 'var(--wt-tap-min)',
        'safe-top': 'var(--wt-safe-top)',
        'safe-bottom': 'var(--wt-safe-bottom)',
      },
      maxWidth: {
        content: 'var(--wt-content-max)',
      },
      transitionTimingFunction: {
        out: 'var(--wt-ease-out)',
        bounce: 'var(--wt-ease-bounce)',
        anticipate: 'var(--wt-ease-anticipate)',
      },
      transitionDuration: {
        instant: 'var(--wt-dur-instant)',
        fast: 'var(--wt-dur-fast)',
        base: 'var(--wt-dur-base)',
        slow: 'var(--wt-dur-slow)',
      },
    },
  },
  plugins: [],
};
