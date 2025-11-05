// eslint.config.cjs — Flat Config (CommonJS) für ESLint 9 + Next 15 + Prettier
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const next = require("eslint-config-next");
const reactHooks = require("eslint-plugin-react-hooks");
const prettier = require("eslint-config-prettier");

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [
  // Globale Ignorierliste
  {
    ignores: ["node_modules/**", ".next/**", "dist/**", "next-env.d.ts"],
  },

  // Baseline-Regeln
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...(next?.configs?.recommended ? next.configs.recommended : []),

  // React Hooks
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "off",
    },
  },

  // Node Globals für CJS
  {
    files: ["**/*.cjs"],
    languageOptions: {
      globals: {
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        process: "readonly",
      },
      sourceType: "commonjs",
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
    },
  },

  // Temporäre Ausnahmen (bis getypte Dateien fertig sind)
  {
    files: ["lib/registry.ts", "app/konfigurator/page.tsx"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },

  // Kleine Hausregeln
  {
    files: ["lib/storage.ts"],
    rules: { "no-empty": ["error", { allowEmptyCatch: true }] },
  },

  // 🔧 Prettier — deaktiviert ESLint-Formatierungsregeln, nutzt Prettier-Stil
  prettier,
];

