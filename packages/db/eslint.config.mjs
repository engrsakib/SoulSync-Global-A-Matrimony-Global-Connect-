import nestConfig from '@soulsync/config/eslint/nest';

const eslintConfig = [{ ignores: ['prisma.config.ts', 'scripts/**'] }, ...nestConfig];

export default eslintConfig;
