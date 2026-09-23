import i18next from "i18next";
import { K, NS_BRICK_KIT } from "./constants";
import en from "./locales/en";
import zh from "./locales/zh";

describe("brick-kit license tips i18n", () => {
  beforeAll(async () => {
    await i18next.init({
      lng: "zh",
      ns: NS_BRICK_KIT,
      defaultNS: NS_BRICK_KIT,
      resources: {
        zh: { [NS_BRICK_KIT]: zh },
        en: { [NS_BRICK_KIT]: en },
      },
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
  });

  const N = `${NS_BRICK_KIT}:`;

  it.each([
    ["zh", "离License过期还有 8 天"],
    ["en", "License expires in 8 days"],
  ])("license tip in %s", async (lang, expected) => {
    await i18next.changeLanguage(lang);
    expect(i18next.t(`${N}${K.LICENSE_EXPIRES_IN_DAY}`, { count: 8 })).toBe(
      expected
    );
  });

  it("license tip shows singular for count=1", async () => {
    await i18next.changeLanguage("en");
    expect(i18next.t(`${N}${K.LICENSE_EXPIRES_IN_DAY}`, { count: 1 })).toBe(
      "License expires in 1 day"
    );
  });

  it("license tip plural works under host compatibilityJSON v3 mode", async () => {
    await i18next.changeLanguage("en");
    (i18next.options as Record<string, unknown>).compatibilityJSON = "v3";
    try {
      expect(i18next.t(`${N}${K.LICENSE_EXPIRES_IN_DAY}`, { count: 8 })).toBe(
        "License expires in 8 days"
      );
    } finally {
      delete (i18next.options as Record<string, unknown>).compatibilityJSON;
    }
  });

  it("slow-render tip interpolates both times in both languages", async () => {
    const params = { renderTime: 3.456, suggestTime: 3 };
    await i18next.changeLanguage("zh");
    expect(i18next.t(`${N}${K.PAGE_RENDER_SLOW_TIP}`, params)).toContain(
      "当前页面渲染时间 3.456 秒"
    );
    await i18next.changeLanguage("en");
    expect(i18next.t(`${N}${K.PAGE_RENDER_SLOW_TIP}`, params)).toContain(
      "render time is 3.456 seconds"
    );
  });

  it("view suggestion exists in both languages", async () => {
    await i18next.changeLanguage("zh");
    expect(i18next.t(`${N}${K.VIEW_SUGGESTION}`)).toBe("建议解决思路");
    await i18next.changeLanguage("en");
    expect(i18next.t(`${N}${K.VIEW_SUGGESTION}`)).toBe("View suggestions");
  });
});
