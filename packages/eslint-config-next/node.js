// @ts-check
import globals from "globals";
import deepFreeze from "./deepFreeze.js";

const config = deepFreeze({
  languageOptions: {
    globals: {
      ...globals.node,
    },
  },
  rules: {
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-require-imports": "off",
    "no-console": "off",
  },
});

export default config;
