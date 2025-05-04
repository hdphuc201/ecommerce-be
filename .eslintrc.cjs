module.exports = {
  env: { es2020: true, node: true },
  extends: ["eslint:recommended"],
  parser: "@babel/eslint-parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    requireConfigFile: false,
    allowImportExportEverywhere: true,
  },
  plugins: ["simple-import-sort", "unused-imports"],
  rules: {
    // Common
    "no-console": 1,
    "no-extra-boolean-cast": 0,
    "no-lonely-if": 1,
    "no-unused-vars": 0, // Tắt mặc định để dùng rule của unused-imports
    "no-trailing-spaces": 1,
    "no-multi-spaces": 1,
    "no-multiple-empty-lines": 1,
    "space-before-blocks": ["error", "always"],
    "object-curly-spacing": [1, "always"],
    indent: ["warn", 2],
    // semi: [1, 'never'],
    "array-bracket-spacing": 1,
    "linebreak-style": 0,
    "no-unexpected-multiline": "warn",
    "keyword-spacing": 1,
    // 'comma-dangle': 1,
    "comma-spacing": 1,
    "arrow-spacing": 1,

    // Import sort
    "simple-import-sort/imports": "warn",
    "simple-import-sort/exports": "warn",

    // Xóa import không dùng
    "unused-imports/no-unused-imports": "warn",
    "unused-imports/no-unused-vars": [
      "warn",
      {
        vars: "all",
        varsIgnorePattern: "^_",
        args: "after-used",
        argsIgnorePattern: "^_",
      },
    ],
  },
};
