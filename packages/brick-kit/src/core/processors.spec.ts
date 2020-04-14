import { processBootstrapResponse } from "./processors";

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
            defaultConfig: {
              quality: "good",
            },
            userConfig: {
              quality: "bad",
            },
          },
        },
        // Has route alias.
        {
          app: {},
          routes: [
            {
              path: "/a",
              alias: "a",
            },
          ],
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
            $$routeAliasMap: new Map(),
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
            $$routeAliasMap: new Map(),
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
            $$routeAliasMap: new Map(),
          },
        },
        // With both `defaultConfig` and `userConfig`.
        {
          app: {
            defaultConfig: {
              quality: "good",
            },
            userConfig: {
              quality: "bad",
            },
            config: {
              quality: "bad",
            },
            $$routeAliasMap: new Map(),
          },
        },
        // Has route alias.
        {
          app: {
            config: {},
            $$routeAliasMap: new Map([
              [
                "a",
                {
                  path: "/a",
                  alias: "a",
                },
              ],
            ]),
          },
          routes: [
            {
              path: "/a",
              alias: "a",
            },
          ],
        },
      ],
    });
  });
});
