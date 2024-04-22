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
              },
              en: {
                name: "Application B Alias",
              },
            },
          },
        },
      },
      {
        id: "app-b",
        name: "App B",
        localeName: "Application B Alias",
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
              },
              en: {
                name: "Application B Alias",
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
