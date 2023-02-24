export enum K {
  HELLO = "HELLO",
  WORLD = "WORLD",
}

const en: Locale = {
  HELLO: "Hello",
  WORLD: "World",
};

const zh: Locale = {
  HELLO: "你好",
  WORLD: "世界",
};

export const NS = "bricks/demo-basic/say-hello";

export const locales = {
  en,
  zh,
};

type Locale = { [key in K]: string };
