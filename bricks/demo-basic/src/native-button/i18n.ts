export enum K {
  WORKS = "WORKS",
}

const en: Locale = {
  WORKS: "Works!",
};

const zh: Locale = {
  WORKS: "可以工作！",
};

export const NS = "bricks/demo-basic/native-button";

export const locales = {
  en,
  zh,
};

type Locale = { [key in K]: string };
