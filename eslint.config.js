const tseslint = require('typescript-eslint');
const js = require('@eslint/js');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

module.exports = tseslint.config(
  // Global ignores
  {
    ignores: ['node_modules/**', 'dist/**', '.expo/**'],
  },

  // CJS root config files — Node environment, no TypeScript rules
  {
    files: ['*.js', '*.cjs'],
    ...js.configs.recommended,
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // TypeScript source files
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [...tseslint.configs.recommended],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      prettier: prettierPlugin,
    },
    languageOptions: {
      globals: { ...globals.browser },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // React
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',

      // React Hooks
      ...reactHooksPlugin.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'error',
      // set-state-in-effect is overly strict for async data-fetching patterns in React Native
      'react-hooks/set-state-in-effect': 'off',

      // TypeScript — allow _-prefixed intentional stubs
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Console discipline
      'no-console': ['warn', { allow: ['error', 'warn'] }],

      // Prettier
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
    },
  },
);
