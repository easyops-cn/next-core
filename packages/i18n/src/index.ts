import i18next, { i18n as I18n } from "i18next";

export const i18n: I18n =
  process.env.NODE_ENV === "test"
    ? (i18next as unknown as typeof i18next.default)
    : /* istanbul ignore next */ i18next.default || i18next;

export * from "./init.js";
export * from "./text.js";
