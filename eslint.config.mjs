import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

// Next 16 removed `next lint`; ESLint runs directly (`npm run lint`). Same rule set as the old .eslintrc.json.
const eslintConfig = defineConfig([
  ...nextVitals,
  {
    // React Compiler advisories that arrived with eslint-config-next 16. This app doesn't use the React Compiler,
    // and the flagged patterns (setState in an effect, ref assignment during render, …) work as written, so they
    // stay visible as warnings instead of failing lint. Tighten back to "error" as code gets touched.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    ".next-*/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/**",
    // Separate projects living inside this folder, each with its own tooling.
    "Riskyc/**",
    "riskyc-pos/**",
    "riskyc-mobile/**",
  ]),
]);

export default eslintConfig;
