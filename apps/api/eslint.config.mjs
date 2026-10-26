import nestConfig from '@soulsync/config/eslint/nest';

const eslintConfig = [...nestConfig, { ignores: ['src/**/*.test.ts'] }];

export default eslintConfig;
