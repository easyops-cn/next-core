import { jest, describe, test, expect } from "@jest/globals";
import { http } from "@next-core/http";
import {
  BootstrapStandaloneApi_runtimeStandalone,
  BootstrapV2Api_bootstrapV2,
  BootstrapV2Api_getAppStoryboardV2,
} from "@next-api-sdk/api-gateway-sdk";
import { RuntimeApi_runtimeMicroAppStandalone } from "@next-api-sdk/micro-app-standalone-sdk";
import { initializeI18n } from "@next-core/i18n";
import { fulfilStoryboard, loadBootstrapData } from "./loadBootstrapData.js";

jest.mock("@next-core/http");
jest.mock("@next-api-sdk/api-gateway-sdk");
jest.mock("@next-api-sdk/micro-app-standalone-sdk");
const consoleError = jest.spyOn(console, "error");
const consoleWarn = jest.spyOn(console, "warn");

const mockRuntimeStandalone = (
  BootstrapStandaloneApi_runtimeStandalone as jest.Mock<() => Promise<unknown>>
).mockResolvedValue({
  settings: {
    featureFlags: {
      "runtime-flag": true,
    },
    misc: {
      runtimeMisc: 2,
    },
    homepage: "/runtime/homepage",
  },
});
(
  RuntimeApi_runtimeMicroAppStandalone as jest.Mock<() => Promise<unknown>>
).mockResolvedValue({
  userConfig: {
    runtimeUserConf: 9,
  },
  injectMenus: [
    {
      title: "Menu 1",
    },
    {
      title: "Menu 2",
      overrideApp: {
        defaultConfig: {
          overrideDefault: 4,
        },
        userConfig: {
          overrideUser: 5,
        },
      },
    },
  ],
});

const mockBootstrapV2 = BootstrapV2Api_bootstrapV2 as jest.Mock<
  () => Promise<unknown>
>;
const mockGetAppStoryboardV2 = BootstrapV2Api_getAppStoryboardV2 as jest.Mock<
  () => Promise<unknown>
>;

jest.spyOn(http, "get").mockImplementation(async (url) => {
  switch (url) {
    case "bootstrap.app-a.json":
      return {
        brickPackages: [],
        storyboards: [
          {
            app: {
              id: "app-a",
              name: "App A",
              locales: {
                zh: { name: "应用 A" },
                en: { name: "Application A" },
              },
              defaultConfig: {
                defaultConf: 7,
              },
              userConfig: {
                userConf: 8,
              },
            },
          },
        ],
        settings: {
          featureFlags: {
            "bootstrap-flag": true,
          },
          misc: {
            bootstrapMisc: 1,
          },
          homepage: "/bootstrap/homepage",
        },
      };
    case "bootstrap.app-b.json":
      return {
        brickPackages: [],
        storyboards: [
          {
            app: {
              id: "app-b",
              name: "App B",
            },
          },
        ],
        settings: {
          featureFlags: {
            "bootstrap-flag": true,
          },
          misc: {
            bootstrapMisc: 1,
          },
          homepage: "/bootstrap/homepage",
        },
      };
    case "app-a/conf.yaml":
      return "";
    case "app-b/conf.yaml":
      return `
sys_settings:
  feature_flags:
    conf-flag: true
user_config:
  x: true
`;
  }
  throw new Error("oops");
});

initializeI18n();

describe("loadBootstrapData", () => {
  beforeEach(() => {
    delete window.STANDALONE_MICRO_APPS;
    delete window.BOOTSTRAP_FILE;
    delete window.APP_ID;
    delete window.APP_ROOT;
  });

  test("standalone", async () => {
    window.STANDALONE_MICRO_APPS = true;
    window.BOOTSTRAP_FILE = "bootstrap.app-a.json";
    window.APP_ID = "app-a";
    window.APP_ROOT = "app-a/";
    const promise = loadBootstrapData();
    expect(RuntimeApi_runtimeMicroAppStandalone).toBeCalledWith("app-a");
    const data = await promise;
    expect(data).toEqual({
      brickPackages: [],
      storyboards: [
        {
          app: {
            id: "app-a",
            name: "App A",
            localeName: "Application A",
            locales: {
              zh: { name: "应用 A" },
              en: { name: "Application A" },
            },
            defaultConfig: {
              defaultConf: 7,
            },
            userConfig: {
              userConf: 8,
            },
          },
        },
      ],
      settings: {
        featureFlags: {
          "bootstrap-flag": true,
          "runtime-flag": true,
        },
        misc: {
          bootstrapMisc: 1,
          runtimeMisc: 2,
        },
        homepage: "/runtime/homepage",
      },
    });

    await fulfilStoryboard(data.storyboards[0]);
    expect(RuntimeApi_runtimeMicroAppStandalone).toBeCalledTimes(1);

    expect(data.storyboards[0]).toEqual({
      $$fulfilled: true,
      $$fulfilling: expect.any(Promise),
      app: {
        id: "app-a",
        name: "App A",
        localeName: "Application A",
        locales: {
          zh: { name: "应用 A" },
          en: { name: "Application A" },
        },
        defaultConfig: {
          defaultConf: 7,
        },
        userConfig: {
          userConf: 8,
          runtimeUserConf: 9,
        },
        config: {
          defaultConf: 7,
          userConf: 8,
          runtimeUserConf: 9,
        },
      },
      meta: {
        injectMenus: [
          {
            title: "Menu 1",
          },
          {
            title: "Menu 2",
            overrideApp: {
              defaultConfig: {
                overrideDefault: 4,
              },
              userConfig: {
                overrideUser: 5,
              },
              config: {
                overrideDefault: 4,
                overrideUser: 5,
              },
            },
          },
        ],
      },
    });
  });

  test("standalone with conf.yaml", async () => {
    consoleWarn.mockReturnValueOnce();
    mockRuntimeStandalone.mockRejectedValueOnce(new Error("oops"));
    window.STANDALONE_MICRO_APPS = true;
    window.BOOTSTRAP_FILE = "bootstrap.app-b.json";
    window.APP_ROOT = "app-b/";
    const promise = loadBootstrapData();
    const data = await promise;
    expect(data).toEqual({
      brickPackages: [],
      storyboards: [
        {
          app: {
            id: "app-b",
            name: "App B",
            localeName: "App B",
            userConfig: {
              x: true,
            },
          },
        },
      ],
      settings: {
        featureFlags: {
          "conf-flag": true,
        },
      },
    });
    expect(consoleWarn).toBeCalledTimes(1);
  });

  test("non-standalone", async () => {
    mockBootstrapV2.mockResolvedValueOnce({
      brickPackages: [],
      storyboards: [
        {
          app: {
            id: "app-a",
            name: "App A",
          },
        },
      ],
    });
    mockGetAppStoryboardV2.mockResolvedValueOnce({
      app: {
        userConfig: {
          userConf: 42,
        },
      },
      routes: [],
    });

    const data = await loadBootstrapData();
    expect(data).toEqual({
      brickPackages: [],
      storyboards: [
        {
          app: {
            id: "app-a",
            name: "App A",
            localeName: "App A",
          },
        },
      ],
    });

    await fulfilStoryboard(data.storyboards[0]);
    await fulfilStoryboard(data.storyboards[0]);
    expect(mockGetAppStoryboardV2).toBeCalledTimes(1);

    expect(data.storyboards[0]).toEqual({
      $$fulfilled: true,
      $$fulfilling: null,
      app: {
        id: "app-a",
        name: "App A",
        localeName: "App A",
        userConfig: {
          userConf: 42,
        },
        config: {
          userConf: 42,
        },
      },
      routes: [],
    });
  });
});
