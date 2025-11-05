// eslint.config.cjs — Flat Config (CommonJS) für ESLint 9 + Next 15 + Prettier
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const next = require("eslint-config-next");
const reactHooks = require("eslint-plugin-react-hooks");
const prettier = require("eslint-config-prettier");

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [
  // 0) Globale Ignorierliste
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "next-env.d.ts" // auto-generiert
    ]
  },

  // 1) Basis-JS-Regeln
  js.configs.recommended,

  // 2) TypeScript-Empfehlungen (ohne Type-Check)
  ...tseslint.configs.recommended,

  // 3) Next.js-Empfehlungen
  ...(next && next.configs && next.configs.recommended ? next.configs.recommended : []),

  // 4) React-Hooks-Regeln
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "off" // gezielte Kontrolle statt global
    }
  },

  // 5) CJS-Dateien (z. B. diese Config): Node-Globals erlauben
  {
    files: ["**/*.cjs"],
    languageOptions: {
      globals: {
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        process: "readonly"
      },
      sourceType: "commonjs"
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off"
    }
  },

  // 6) Kleine Hausregeln
  {
    files: ["lib/storage.ts"],
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }]
    }
  },

  // 7) Prettier-Integration: schaltet kollidierende Format-Regeln ab
  prettier
];

