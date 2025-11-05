// eslint.config.cjs — Flat Config (CommonJS, robust)
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const next = require("eslint-plugin-next");

module.exports = [
  { ignores: ["node_modules/**", ".next/**", "dist/**"] },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  next.configs.recommended,

  {
    files: ["lib/registry.ts", "app/konfigurator/page.tsx"],
    rules: { "@typescript-eslint/no-explicit-any": "off" }
  },
];

