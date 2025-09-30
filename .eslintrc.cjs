/* eslint-env node */

module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint', 'react-refresh'],
  rules: {
    'react-refresh/only-export-components': 'off',
    'react-hooks/exhaustive-deps': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
  overrides: [
    {
      files: ['tests/unit/**/*.ts', 'tests/unit/**/*.tsx'],
      env: { jest: true, node: true },
      extends: ['plugin:testing-library/react', 'plugin:jest-dom/recommended'],
      plugins: ['testing-library', 'jest-dom'],
      rules: {
        'react-refresh/only-export-components': 'off',
        'testing-library/no-unnecessary-act': 'off',
      },
    },
    {
      files: ['*.config.{js,ts,mjs,cjs}', '**/*.config.{js,ts,mjs,cjs}'],
      env: { node: true },
    },
  ],
};
