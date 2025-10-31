module.exports = {
  extends: ['expo', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  ignorePatterns: ['dist/*', '.expo/**', 'node_modules/**'],
};
