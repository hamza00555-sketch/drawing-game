import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'functions/lib', 'functions/node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      /*
       * Identity guard. Icon packs may not stand in for وش ذا؟ artwork.
       * The full art-direction check (emoji, hand-coded SVG) lives in
       * scripts/check-visual-purity.mjs, which also covers CSS and HTML.
       */
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'lucide-react', message: 'الأيقونات من Higgsfield عبر AssetSlot.' },
            { name: 'react-icons', message: 'الأيقونات من Higgsfield عبر AssetSlot.' },
            { name: '@heroicons/react', message: 'الأيقونات من Higgsfield عبر AssetSlot.' },
            { name: '@mui/icons-material', message: 'الأيقونات من Higgsfield عبر AssetSlot.' },
          ],
          patterns: ['@fortawesome/*'],
        },
      ],

      /*
       * Timer correctness guard. Device clocks are wrong often enough to ruin a
       * 3-second turn, so gameplay timing must go through engine/clock.ts.
       */
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message:
            'استخدم serverNow() أو msUntil() من engine/clock.ts — ساعة الجهاز غير موثوقة للمؤقتات.',
        },
      ],
    },
  },
  {
    /*
     * Exemptions from the device-clock rule.
     *
     * - engine/clock.ts is the module that measures the skew.
     * - Tests simulate a skewed device; that is the point of clock.test.ts.
     * - functions/ runs on Google's servers, where Date.now() IS the
     *   authoritative clock the whole rule exists to defer to. Writing
     *   phaseEndsAt from it is correct, not a violation.
     * - src/dev/ builds fixtures for the preview gallery; those deadlines are
     *   mock data, never gameplay, and never ship.
     */
    files: [
      'src/engine/clock.ts',
      'src/dev/**/*.tsx',
      'scripts/**/*.mjs',
      '**/*.test.ts',
      'functions/src/**/*.ts',
    ],
    rules: { 'no-restricted-syntax': 'off' },
  },
);
