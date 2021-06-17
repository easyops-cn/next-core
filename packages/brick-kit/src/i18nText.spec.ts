import i18next from "i18next";
import { I18nData } from "@next-core/brick-types";
import { i18nText } from "./i18nText";

i18next.init();

describe("i18nText", () => {
  it.each<[string, I18nData, string, jest.DoneCallback?]>([
    [null, {}, undefined],
    [null, null, undefined],
    [
      "zh",
      {
        en: "hello",
        zh: "您好",
      },
      "您好",
    ],
    [
      "zh-CN",
      {
        en: "hello",
        zh: "您好",
      },
      "您好",
    ],
    [
      "zh-CN",
      {
        "en-US": "hello",
        "zh-HK": "你好",
        "zh-CN": "您好",
      },
      "您好",
    ],
    [
      "zh",
      {
        "en-US": "hello",
        "zh-HK": "你好",
        "zh-CN": "您好",
      },
      "你好",
    ],
    [
      "es",
      {
        en: "hello",
        zh: "您好",
      },
      undefined,
    ],
  ])(
    "for language %s and data %j, should return %j",
    (language, data, result, done) => {
      i18next.changeLanguage(language, () => {
        expect(i18nText(data)).toBe(result);
        done();
      });
    }
  );
});
