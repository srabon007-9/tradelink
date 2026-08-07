module.exports = {
  env: {
    node: true,
    es2021: true,
    commonjs: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'commonjs',
  },
  rules: {
    // Error prevention
    'no-console': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-undef': 'error',

    // Code style
    'prefer-const': 'error',
    'no-var': 'error',
    eqeqeq: ['error', 'always'],
    curly: 'error',

    // Express/Node patterns
    'no-process-exit': 'warn',
  },
  ignorePatterns: ['node_modules/', 'dist/'],
};
