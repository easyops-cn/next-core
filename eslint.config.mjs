import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ["**/node_modules", "**/dist", "sdk"],
  },
  ...compat.extends("@next-core/eslint-config-next"),
  ...compat.extends("@next-core/eslint-config-next/node").map((config) => ({
    ...config,

    files: [
      "cypress/plugins/**/*.js",
      "packages/brick-container/{dev-server,serve,webpack}/**/*.js",
      "packages/eslint-config-next/*.js",
      "packages/babel-preset-next/*.js",
      "packages/babel-preset-prismjs/*.js",
      "packages/browserslist-config-next/*.js",
      "packages/build-next-libs/**/*.js",
      "packages/build-next-bricks/**/*.js",
      "packages/test-next/**/*.js",
      "packages/brick-playground/serve/**/*.js",
      "packages/create-api-sdk/**/*.{ts,js}",
      "packages/webpack/**/*.{ts,js}",
      "packages/doc-helpers/**/*.js",
      "packages/serve-helpers/**/*.js",
      "packages/yo/**/*.js",
      "v3/lodash-v3/**/*.js",
      "v3/moment-v3/**/*.js",
    ],
  })),
  ...compat.extends("@next-core/eslint-config-next/node").map((config) => ({
    ...config,
    files: ["cypress/**/*.js"],
  })),
  {
    files: ["cypress/**/*.js"],

    languageOptions: {
      globals: {
        ...globals.mocha,
        ...Object.fromEntries(
          Object.entries(globals.jest).map(([key]) => [key, "off"])
        ),
        cy: true,
        Cypress: true,
      },
    },
  },
];
