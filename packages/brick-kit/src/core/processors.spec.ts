import i18next from "i18next";
import { processBootstrapResponse } from "./processors";

i18next.init({
  fallbackLng: "en",
});

describe("processBootstrapResponse", () => {
  it("should work", () => {
    const data: any = {
      storyboards: [
        // Empty app.
        {
          app: {},
        },
        // No app.
        {},
        // With only `defaultConfig`.
        {
          app: {
            defaultConfig: {
              quality: "good",
            },
          },
        },
        // With only `userConfig`.
        {
          app: {
            userConfig: {
              quality: "bad",
            },
          },
        },
        // With both `defaultConfig` and `userConfig`.
        {
          app: {
            name: "Test Only",
            defaultConfig: {
              quality: "good",
            },
            userConfig: {
              quality: "bad",
            },
          },
        },
        // With locales.
        {
          app: {
            id: "hello-world",
            name: "Hola Mundo",
            locales: {
              zh: {
                name: "你好，世界",
              },
              en: {
                name: "Hello World",
              },
            },
          },
        },
      ],
    };
    processBootstrapResponse(data);
    expect(data).toEqual({
      storyboards: [
        // Empty app.
        {
          app: {
            config: {},
          },
        },
        // No app.
        {},
        // With only `defaultConfig`.
        {
          app: {
            defaultConfig: {
              quality: "good",
            },
            config: {
              quality: "good",
            },
          },
        },
        // With only `userConfig`.
        {
          app: {
            userConfig: {
              quality: "bad",
            },
            config: {
              quality: "bad",
            },
          },
        },
        // With both `defaultConfig` and `userConfig`.
        {
          app: {
            name: "Test Only",
            localeName: "Test Only",
            defaultConfig: {
              quality: "good",
            },
            userConfig: {
              quality: "bad",
            },
            config: {
              quality: "bad",
            },
          },
        },
        // With locales.
        {
          app: {
            id: "hello-world",
            name: "Hola Mundo",
            localeName: "Hello World",
            locales: {
              zh: {
                name: "你好，世界",
              },
              en: {
                name: "Hello World",
              },
            },
            config: {},
          },
        },
      ],
    });
  });
});
