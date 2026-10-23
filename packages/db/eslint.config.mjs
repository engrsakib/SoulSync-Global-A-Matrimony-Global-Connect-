import nestConfig from '@soulsync/config/eslint/nest';
import { nodeMjsScripts } from '@soulsync/config/eslint/node-mjs';

/** Match CLI scripts when ESLint cwd is `packages/db` or the monorepo root (lint-staged). */
const dbScriptFiles = ['scripts/**/*.mjs', 'packages/db/scripts/**/*.mjs'];

const eslintConfig = [
  { ignores: ['prisma.config.ts'] },
  ...nestConfig,
  { ...nodeMjsScripts, files: dbScriptFiles },
];

export default eslintConfig;
