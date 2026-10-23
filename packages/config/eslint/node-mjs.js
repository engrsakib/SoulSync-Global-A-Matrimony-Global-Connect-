import globals from 'globals';

/** Shared flat-config slice for Node CLI `.mjs` scripts. */
/** @type {import('eslint').Linter.Config} */
export const nodeMjsScripts = {
  files: ['**/*.mjs'],
  languageOptions: {
    globals: globals.node,
    sourceType: 'module',
  },
};
