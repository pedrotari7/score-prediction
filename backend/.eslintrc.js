module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json', 'tsconfig.dev.json'],
    sourceType: 'module',
  },
  ignorePatterns: [
    '/lib/**/*', // Ignore built files.
  ],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    '@typescript-eslint/indent': ['error', 2],
    '@typescript-eslint/no-non-null-assertion': 0,
    quotes: ['error', 'single'],
    'object-curly-spacing': 0,
    'max-len': ['error', { code: 120 }],
    'quote-props': ['error', 'as-needed'],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '_' }],
  },
};
