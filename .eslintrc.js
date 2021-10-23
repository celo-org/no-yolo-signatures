module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
      '@typescript-eslint',
    ],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
    ],
    env: {
        browser: true,
        amd: true,
        node: true
    },
    overrides: [{
        files: ["*.ts"],
        rules: {
            "@typescript-eslint/no-non-null-assertion": 0,
            "@typescript-eslint/no-explicit-any": 0
        }
    }]
  };
  