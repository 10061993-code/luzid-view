// eslint.config.mjs — Flat Config (ESM)
import next from "eslint-config-next";

export default [
  ...next,
  // 🔧 Temporäre, gezielte Overrides: wir schalten "no-explicit-any" nur in den lauten Dateien aus.
  {
    files: [
      "lib/registry.ts",
      "app/konfigurator/page.tsx"
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
];

