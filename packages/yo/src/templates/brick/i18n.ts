import { i18n } from "@next-core/i18n";

export enum K {}
// HELLO = "HELLO",

const en: Locale = {
  // HELLO: "Hello",
};

const zh: Locale = {
  // HELLO: "你好",
};

export const NS = "bricks/{{pkgName}}/{{>lastTagName}}";

export const locales = { en, zh };

export const t = i18n.getFixedT(null, NS);

type Locale = { [k in K]: string } & {
  [k in K as `${k}_plural`]?: string;
};
