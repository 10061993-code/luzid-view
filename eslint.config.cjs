// eslint.config.cjs — Flat Config (CommonJS, robust)
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const next = require("eslint-config-next");

module.exports = [
  { ignores: ["node_modules/**", ".next/**", "dist/**"] },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...next, // ← nutzt das Config-Array von eslint-config-next

  {
    files: ["lib/registry.ts", "app/konfigurator/page.tsx"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
];

