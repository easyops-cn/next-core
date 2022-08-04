import { http } from "@next-core/brick-http";
import { BootstrapData } from "@next-core/brick-types";
import { standaloneBootstrap } from "./standaloneBootstrap";
import {
  BootstrapStandaloneApi_runtimeStandalone,
  BootstrapStandaloneApi_RuntimeStandaloneResponseBody,
} from "@next-sdk/api-gateway-sdk";

const mockHttpGet = jest.spyOn(http, "get");

jest.mock("@next-sdk/api-gateway-sdk");

window.BOOTSTRAP_FILE = "-/bootstrap.json";
window.APP_ROOT = "";

const mockRuntimeStandalone =
  BootstrapStandaloneApi_runtimeStandalone as jest.MockedFunction<
    typeof BootstrapStandaloneApi_runtimeStandalone
  >;

describe("standaloneBootstrap", () => {
  it.each<
    [
      desc: string,
      rawBootstrap: RecursivePartial<BootstrapData>,
      confString: string,
      runtimeApiReturn: BootstrapStandaloneApi_RuntimeStandaloneResponseBody,
      result: RecursivePartial<BootstrapData>
    ]
  >([
    [
      "should work",
      {
        storyboards: [
          {
            app: {
              id: "app-a",
            },
          },
        ],
      },
      "",
      {},
      {
        storyboards: [
          {
            app: {
              id: "app-a",
            },
          },
        ],
      },
    ],
    [
      "should merge settings",
      {
        storyboards: [
          {
            app: {
              id: "app-a",
            },
          },
        ],
      },
      `
        sys_settings:
          feature_flags:
            myFlag: true
          misc:
            myMisc: yes
      `,
      {},
      {
        storyboards: [
          {
            app: {
              id: "app-a",
            },
          },
        ],
        settings: {
          featureFlags: {
            myFlag: true,
          },
          misc: {
            myMisc: "yes",
          },
        },
      },
    ],
    [
      "should merge user config",
      {
        storyboards: [
          {
            app: {
              id: "app-a",
            },
          },
        ],
      },
      `
        user_config:
          myConfig: 1
      `,
      {},
      {
        storyboards: [
          {
            app: {
              id: "app-a",
              userConfig: {
                myConfig: 1,
              },
            },
          },
        ],
      },
    ],
    [
      "should merge user config by apps",
      {
        storyboards: [
          {
            app: {
              id: "app-a",
            },
          },
          {
            app: {
              id: "app-b",
            },
          },
          {
            app: {
              id: "app-c",
            },
          },
        ],
      },
      `
        user_config_by_apps:
          app-b:
            myConfigB: 2
          app-c:
            myConfigC: 3
          app-d:
            myConfigC: 4
      `,
      {},
      {
        storyboards: [
          {
            app: {
              id: "app-a",
            },
          },
          {
            app: {
              id: "app-b",
              userConfig: {
                myConfigB: 2,
              },
            },
          },
          {
            app: {
              id: "app-c",
              userConfig: {
                myConfigC: 3,
              },
            },
          },
        ],
      },
    ],
    [
      "should apply runtime settings",
      {
        storyboards: [
          {
            app: {
              id: "app-a",
            },
          },
        ],
      },
      "",
      {
        settings: {
          featureFlags: {
            myFlag: false,
            anotherFlag: true,
          },
          misc: {
            anotherMisc: {
              key: "value",
            },
          },
          somethingElse: {
            a: 1,
            b: 2,
          },
        },
      },
      {
        storyboards: [
          {
            app: {
              id: "app-a",
            },
          },
        ],
        settings: {
          featureFlags: {
            myFlag: false,
            anotherFlag: true,
          },
          misc: {
            anotherMisc: {
              key: "value",
            },
          },
          somethingElse: {
            a: 1,
            b: 2,
          },
        },
      },
    ],
    [
      "should merge runtime settings",
      {
        storyboards: [
          {
            app: {
              id: "app-a",
            },
          },
        ],
      },
      `
        sys_settings:
          feature_flags:
            myFlag: true
          misc:
            myMisc: yes
      `,
      {
        settings: {
          featureFlags: {
            myFlag: false,
            anotherFlag: true,
          },
          misc: {
            anotherMisc: {
              key: "value",
            },
          },
          somethingElse: {
            a: 1,
            b: 2,
          },
        },
      },
      {
        storyboards: [
          {
            app: {
              id: "app-a",
            },
          },
        ],
        settings: {
          featureFlags: {
            myFlag: false,
            anotherFlag: true,
          },
          misc: {
            myMisc: "yes",
            anotherMisc: {
              key: "value",
            },
          },
          somethingElse: {
            a: 1,
            b: 2,
          },
        },
      },
    ],
  ])("%s", async (desc, rawBootstrap, confString, runtimeApiReturn, result) => {
    mockRuntimeStandalone.mockResolvedValueOnce(runtimeApiReturn);
    mockHttpGet.mockImplementation((url) => {
      if (url === "conf.yaml") {
        return Promise.resolve(confString);
      }
      return Promise.resolve(rawBootstrap);
    });
    expect(await standaloneBootstrap()).toEqual(result);
  });

  it("should throw error", async () => {
    jest.spyOn(console, "error").mockImplementationOnce(() => void 0);
    mockHttpGet.mockImplementation((url) => {
      if (url === "conf.yaml") {
        return Promise.resolve("a: b: c");
      }
      return Promise.resolve({
        storyboards: [{ app: { id: "my-app" } }],
      });
    });
    await expect(standaloneBootstrap()).rejects.toThrowError(
      "Invalid conf.yaml"
    );
  });
});
