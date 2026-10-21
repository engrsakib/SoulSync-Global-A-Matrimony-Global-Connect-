import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextConfig from '@soulsync/config/eslint/next';

const appRoot = path.dirname(fileURLToPath(import.meta.url)).replaceAll('\\', '/');

const eslintConfig = [
  ...nextConfig,
  {
    settings: {
      next: {
        rootDir: [appRoot, 'apps/web', '.'],
      },
    },
  },
];

export default eslintConfig;
