import i18next from "i18next";
import { NS_$CONSTANT_PACKAGE_NAME$ } from "./constants";
import en from "./locales/en";
import zh from "./locales/zh";

i18next.addResourceBundle("en", NS_$CONSTANT_PACKAGE_NAME$, en);
i18next.addResourceBundle("zh", NS_$CONSTANT_PACKAGE_NAME$, zh);
