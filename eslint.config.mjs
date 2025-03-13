import eslintConfigNext from "@next-core/eslint-config-next";
import nodeConfig from "@next-core/eslint-config-next/node.js";
import globals from "globals";

export default [
  {
    ignores: ["**/node_modules", "**/dist", "sdk"],
  },
  ...eslintConfigNext,
  {
    files: [
      "cypress/plugins/**/*.js",
      "packages/brick-container/serve/**/*.js",
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
    ...nodeConfig,
  },
  {
    files: ["cypress/**/*.js"],
    ...nodeConfig,
  },
  {
    files: ["cypress/**/*.js"],
    languageOptions: {
      globals: {
        ...Object.fromEntries(
          Object.entries(globals.jest).map(([key]) => [key, "off"])
        ),
        ...globals.mocha,
        cy: false,
        Cypress: false,
      },
    },
  },
];
