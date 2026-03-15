import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Utility/helper scripts — not part of the Next.js app bundle
    "run-all.js",
    "run-all.mjs",
    "run-git.sh",
    "run-jest.sh",
    "run-tests.sh",
    "do-work.sh",
    "scripts/**",
    "jest.config.js",
  ]),
]);

export default eslintConfig;
