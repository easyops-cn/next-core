import i18next from "i18next";

export const i18n =
  process.env.NODE_ENV === "test"
    ? i18next
    : /* istanbul ignore next */ (
        i18next as unknown as { default: typeof i18next }
      ).default;

export * from "./init.js";
export * from "./text.js";
