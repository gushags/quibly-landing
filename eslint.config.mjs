import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const localRules = require("./eslint-rules/index.js");

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  { plugins: { custom: localRules } },
  {
    files: [
      "app/**/*.ts",
      "app/**/*.tsx",
      "lib/**/*.ts",
      "lib/**/*.tsx",
      "components/**/*.ts",
      "components/**/*.tsx",
    ],
    ignores: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "eslint-rules/**",
      "lib/env.ts",   // The one sanctioned process.env reader (D-11)
    ],
    rules: {
      "custom/no-raw-process-env": "error",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "eslint-rules/**"]),
]);

export default eslintConfig;
