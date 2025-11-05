// eslint.config.cjs — Flat Config (CommonJS) für ESLint 9 + Next 15 (ohne Rushstack)
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const next = require("eslint-config-next");

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

  // 2) TypeScript-Empfehlungen (ohne type-check für Speed)
  ...tseslint.configs.recommended,

  // 3) Next.js-Empfehlungen
  ...(next && next.configs && next.configs.recommended ? next.configs.recommended : []),

  // 4) Gezielte temporäre Ausnahmen — bis wir diese Dateien sauber typisieren
  {
    files: ["lib/registry.ts", "app/konfigurator/page.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // 5) Kleine Hausregeln/Fixes
  {
    files: ["lib/storage.ts"],
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },

  // 6) PdfButton: exhaustives-deps nur hier ausschalten (statt Header-Kommentar)
  {
    files: ["app/components/PdfButton.tsx"],
    rules: {
      "react-hooks/exhaustive-deps": "off",
    },
  },
];

