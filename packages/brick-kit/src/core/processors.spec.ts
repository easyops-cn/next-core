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
      ],
      settings: {
        misc: {
          hello: "world",
        },
      },
      brickPackages: [
        {
          filePath: "/tmp/brick-a.js",
          bricks: ["my.brick-a"],
        },
      ],
      templatePackages: [
        {
          filePath: "/tmp/template-a.js",
          templates: ["my.template-a"],
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
      ],
      settings: {
        misc: {
          hello: "world",
        },
      },
      brickPackages: [
        {
          filePath: "/tmp/brick-a.js",
          bricks: ["my.brick-a"],
        },
      ],
      templatePackages: [
        {
          filePath: "/tmp/template-a.js",
          templates: ["my.template-a"],
        },
      ],
    });

    expect(data.settings).toEqual({
      misc: {
        hello: "world",
      },
    });

    expect(() => {
      // Override `app.config`.
      data.storyboards[0].app.config.foo = "bar";
    }).toThrowError();

    expect(() => {
      // Override `misc`.
      data.settings.misc.hello = "oops";
    }).toThrowError();

    expect(() => {
      // Override `brickPackages`.
      data.brickPackages.push({
        filePath: "/tmp/brick-b.js",
        bricks: ["my.brick-b"],
      });
    }).toThrowError();

    expect(() => {
      // Override `templatePackages`.
      data.templatePackages[0].templates.push("my.template-b");
    }).toThrowError();
  });
});
