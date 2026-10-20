import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import base from './base.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...base,
  ...nextCoreWebVitals,
  {
    ignores: ['**/.next/**', 'next-env.d.ts'],
  },
];
