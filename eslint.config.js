import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import checkFile from 'eslint-plugin-check-file';

// Naming conventions (CLAUDE.md):
//   Files/Folders -> kebab-case
//   Functions/Variables -> camelCase
//   Classes/Types -> PascalCase
//   Constants -> UPPER_SNAKE_CASE
const NAMING_CONVENTION_RULES = [
  { selector: 'variable', format: ['camelCase', 'PascalCase', 'UPPER_CASE'], leadingUnderscore: 'allow' },
  { selector: 'function', format: ['camelCase', 'PascalCase'] },
  { selector: 'parameter', format: ['camelCase', 'PascalCase'], leadingUnderscore: 'allow' },
  { selector: 'typeLike', format: ['PascalCase'] },
  { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
  { selector: 'import', format: ['camelCase', 'PascalCase', 'UPPER_CASE'] },
];

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'pnpm-lock.yaml'] },

  // TypeScript + React rules
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // var/let/const (CLAUDE.md: "let by default, const only for true constants, never var")
      'no-var': 'error',
      'prefer-const': 'off',

      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/naming-convention': ['error', ...NAMING_CONVENTION_RULES],
    },
  },

  eslintConfigPrettier,

  // Filename/foldername conventions for source code
  // Framework/entry files (vite.config.ts, eslint.config.js) and ambient
  // declarations (*.d.ts) are excluded since renaming them breaks tooling.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.d.ts'],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': ['error', { '**/*.{ts,tsx}': 'KEBAB_CASE' }],
      'check-file/folder-naming-convention': ['error', { '**/': 'KEBAB_CASE' }],
    },
  },

  // CSS files aren't parsed by espree, so they need the check-file processor
  // applied in their own block to get filename-naming-convention checks.
  {
    files: ['src/**/*.css'],
    plugins: { 'check-file': checkFile },
    processor: 'check-file/eslint-processor-check-file',
    rules: {
      'check-file/filename-naming-convention': ['error', { '**/*.css': 'KEBAB_CASE' }, { ignoreMiddleExtensions: true }],
    },
  },
);
