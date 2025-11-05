// eslint.config.cjs — Flat Config (CommonJS) für ESLint 9 + Next 15 + Prettier (ohne Rushstack)
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
      "next-env.d.ts", // auto-generiert
    ],
  },

  // 1) Basis JS-Regeln
  js.configs.recommended,

  // 2) TypeScript-Empfehlungen (schnell, ohne type-check)
  ...tseslint.configs.recommended,

  // 3) Next.js-Empfehlungen (Flat Config)
  ...(next && next.configs && next.configs.recommended ? next.configs.recommended : []),

  // 4) React Hooks (Plugin explizit registrieren)
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      // Exhaustive deps nicht global erzwingen (wir managen das gezielt pro Datei)
      "react-hooks/exhaustive-deps": "off",
    },
  },

  // 5) CJS-Dateien (z. B. diese Config): Node-Globals erlauben, require zulassen
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

  // 6) Gezielte temporäre Ausnahme — NUR noch für den Konfigurator
  {
    files: ["app/konfigurator/page.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // 7) Kleine Hausregeln
  {
    files: ["lib/storage.ts"],
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },

  // 8) Prettier: schaltet kollidierende Formatierungsregeln von ESLint aus
  prettier,
];

