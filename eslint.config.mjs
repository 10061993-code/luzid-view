// eslint.config.mjs — Flat Config ohne Rushstack-Patch
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import next from "eslint-plugin-next";

export default [
  // Ignorieren von Build-/Vendor-Verzeichnissen
  {
    ignores: ["node_modules/**", ".next/**", "dist/**"],
  },

  // Basis JS-Regeln
  js.configs.recommended,

  // TypeScript (ohne type-check für Speed; bei Bedarf unten aktivieren)
  ...tseslint.configs.recommended,

  // Next.js Plugin (empfohlene Regeln)
  ...next.configs.recommended,

  // Optional: Type-Checked TS-Regeln (langsamer). Bei Bedarf auskommentieren & ParserOptions setzen.
  /*
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  ...tseslint.configs.recommendedTypeChecked,
  */

  // ✅ Temporäre, gezielte Overrides – bis wir die Dateien typisieren
  {
    files: [
      "lib/registry.ts",
      "app/konfigurator/page.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

