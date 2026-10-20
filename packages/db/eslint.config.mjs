import nestConfig from '@soulsync/config/eslint/nest';

const eslintConfig = [{ ignores: ['prisma.config.ts'] }, ...nestConfig];

export default eslintConfig;
