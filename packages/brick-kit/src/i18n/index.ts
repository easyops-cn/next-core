import i18next from "i18next";
import { NS_BRICK_KIT } from "./constants";
import en from "./locales/en";
import zh from "./locales/zh";

export const initI18n = (): void => {
  i18next.addResourceBundle("en", NS_BRICK_KIT, en);
  i18next.addResourceBundle("zh", NS_BRICK_KIT, zh);
};
