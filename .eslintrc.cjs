module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'filenames', 'jest', 'import', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:jest/recommended',
    'plugin:jest/style',
    'plugin:node/recommended',
    'plugin:unicorn/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
    'prettier/@typescript-eslint',
  ],
  settings: {
    node: {
      tryExtensions: ['.js', '.json', '.d.ts', '.ts', '.tsx'],
      convertPath: [
        {
          include: ['packages/**/src/**/*.ts'],
          replace: ['^packages/(.+)/src/(.+)\\.ts$', 'lib/$1.js'],
        },
      ],
    },
    'import/resolver': {
      node: { extensions: ['.js', '.mjs', '.ts', '.mts'] },
    },
  },
  env: {
    browser: false,
    node: true,
    es6: true,
  },
  rules: {
    'no-unused-vars': 'off',
    'no-global-assign': ['error', { exceptions: ['console'] }],

    'prettier/prettier': 'error',

    '@typescript-eslint/no-unused-vars': 'error',

    'unicorn/no-reduce': 'off',
    'unicorn/no-null': 'off',
    'unicorn/no-array-reduce': 'off',
    'unicorn/no-array-for-each': 'off',
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/import-style': 'off',
    'unicorn/no-fn-reference-in-iterator': 'off',
    'unicorn/no-process-exit': 'off',
    'unicorn/no-this-assignment': 'off',
    'unicorn/prefer-node-protocol': 'off',

    'node/no-unsupported-features/es-syntax': ['error', { ignores: ['dynamicImport', 'modules'] }],
    'node/no-extraneous-import': [
      'error',
      {
        allowModules: ['@microsoft/jest-sarif', 'vite', 'vitest'],
      },
    ],
    'node/no-missing-import': 'off',
    'node/no-unpublished-import': [
      'error',
      {
        allowModules: ['ink-testing-library'],
      },
    ],

    'import/no-unresolved': [
      'off',
      {
        ignore: ['sarif', 'ink-testing-library'],
      },
    ],
    'import/order': 'error',
    'import/extensions': [
      'off',
      'always',
      {
        js: 'never',
        ts: 'never',
        jsx: 'never',
        mjs: 'never',
      },
    ],

    'jest/prefer-to-be': 'off',
  },
  overrides: [
    {
      files: ['packages/checkup-plugin-ember/src/**/*.ts', 'packages/cli/src/**/*.ts'],
      rules: {
        'node/no-extraneous-import': [
          'error',
          {
            allowModules: ['type-fest'],
          },
        ],
      },
    },
    {
      files: ['packages/checkup-plugin-javascript/src/**/*.ts'],
      rules: {
        'node/no-extraneous-import': [
          'error',
          {
            allowModules: ['@babel/types', 'ast-types', 'type-fest'],
          },
        ],
      },
    },
    {
      files: ['packages/checkup-plugin-ember/__tests__/eslint-rule-tests/test-types.test.js'],
      rules: {
        'node/no-extraneous-require': [
          'error',
          {
            allowModules: ['eslint'],
          },
        ],
      },
    },
    {
      files: ['packages/core/src/**/*.ts'],
      rules: {
        'node/no-extraneous-import': [
          'error',
          {
            allowModules: ['@babel/types', '@babel/traverse'],
          },
        ],
      },
    },
    {
      files: [
        'packages/**/__tests__/**/*.ts',
        'packages/**/__tests__/**/*.tsx',
        'packages/test-helpers/**/*.ts',
      ],
      env: {
        jest: true,
      },
      rules: {
        'node/no-extraneous-import': 'off',
        'node/no-unpublished-import': 'off',
        'node/no-unpublished-require': 'off',
      },
    },
    {
      files: ['packages/**/*.tsx'],
      rules: {
        'unicorn/filename-case': 'off',
      },
    },
  ],
  globals: {
    React: true,
    JSX: true,
    NodeJS: true,
  },
};
