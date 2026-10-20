import globals from 'globals';
import base from './base.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...base,
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
];
