import { mergeAppConfig } from "./processors";

describe("mergeAppConfig", () => {
  it("should merge app config", () => {
    const data: any = {
      storyboards: [
        // Empty app.
        {
          app: {}
        },
        // No app.
        {},
        // With only `defaultConfig`.
        {
          app: {
            defaultConfig: {
              quality: "good"
            }
          }
        },
        // With only `userConfig`.
        {
          app: {
            userConfig: {
              quality: "bad"
            }
          }
        },
        // With both `defaultConfig` and `userConfig`.
        {
          app: {
            defaultConfig: {
              quality: "good"
            },
            userConfig: {
              quality: "bad"
            }
          }
        }
      ]
    };
    mergeAppConfig(data);
    expect(data).toEqual({
      storyboards: [
        // Empty app.
        {
          app: {
            config: {}
          }
        },
        // No app.
        {},
        // With only `defaultConfig`.
        {
          app: {
            defaultConfig: {
              quality: "good"
            },
            config: {
              quality: "good"
            }
          }
        },
        // With only `userConfig`.
        {
          app: {
            userConfig: {
              quality: "bad"
            },
            config: {
              quality: "bad"
            }
          }
        },
        // With both `defaultConfig` and `userConfig`.
        {
          app: {
            defaultConfig: {
              quality: "good"
            },
            userConfig: {
              quality: "bad"
            },
            config: {
              quality: "bad"
            }
          }
        }
      ]
    });
  });
});
