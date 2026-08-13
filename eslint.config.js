import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'functions/lib'] },
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
     * The clock module is the one place allowed to read the device clock.
     * Tests need it too — simulating a skewed device is the whole point of
     * clock.test.ts.
     */
    files: ['src/engine/clock.ts', 'scripts/**/*.mjs', '**/*.test.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
);
