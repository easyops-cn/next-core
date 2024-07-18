import i18next from "i18next";
import { setAppLocales } from "./setAppLocales";

i18next.init({
  fallbackLng: "en",
});

describe("setAppLocales", () => {
  it.each<[any, any]>([
    [
      {
        name: "Test Only",
      },
      {
        name: "Test Only",
        localeName: "Test Only",
        localeTitle: "",
      },
    ],
    [
      {
        id: "app-a",
        name: "App A",
        locales: {
          zh: {
            name: "小产品 A",
          },
          en: {
            name: "Application A",
          },
        },
      },
      {
        id: "app-a",
        name: "App A",
        localeName: "Application A",
        localeTitle: "",
        locales: {
          zh: {
            name: "小产品 A",
          },
          en: {
            name: "Application A",
          },
        },
      },
    ],
    [
      {
        id: "app-b",
        name: "App B",
        locales: {
          zh: {
            name: "小产品 B",
          },
          en: {
            name: "Application B",
          },
        },
        config: {
          settings: {
            locales: {
              zh: {
                name: "小产品 B 别名",
                title: "小产品 B 标题",
              },
              en: {
                name: "Application B Alias",
                title: "Application B Title",
              },
            },
          },
        },
      },
      {
        id: "app-b",
        name: "App B",
        localeName: "Application B Alias",
        localeTitle: "Application B Title",
        locales: {
          zh: {
            name: "小产品 B",
          },
          en: {
            name: "Application B",
          },
        },
        config: {
          settings: {
            locales: {
              zh: {
                name: "小产品 B 别名",
                title: "小产品 B 标题",
              },
              en: {
                name: "Application B Alias",
                title: "Application B Title",
              },
            },
          },
        },
      },
    ],
  ])("setAppLocales", (app, result) => {
    setAppLocales(app);
    expect(app).toEqual(result);
  });
});
