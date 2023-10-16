import { jest, describe, test, expect } from "@jest/globals";
import { http } from "@next-core/http";
import {
  BootstrapStandaloneApi_runtimeStandalone,
  BootstrapV2Api_bootstrapV2,
  BootstrapV2Api_getAppStoryboardV2,
} from "@next-api-sdk/api-gateway-sdk";
import { RuntimeApi_runtimeMicroAppStandalone } from "@next-api-sdk/micro-app-standalone-sdk";
import { fulfilStoryboard, loadBootstrapData } from "./loadBootstrapData.js";
import { registerMocks } from "./mocks.js";

jest.mock("@next-core/http");
jest.mock("@next-api-sdk/api-gateway-sdk");
jest.mock("@next-api-sdk/micro-app-standalone-sdk");
jest.mock("./mocks.js");
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
const mockRuntimeMicroAppStandalone = (
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
              menuIcon: {
                imgSrc:
                  "api/gateway/object_store.object_store.GetObject/api/v1/objectStore/bucket/next-builder/object/test.jpeg",
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
              menuIcon: {
                imgSrc: "http://example.com",
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
    case "bootstrap.app-c.json":
    case "bootstrap.app-d.json":
    case "bootstrap.app-e.json":
    case "bootstrap.app-f.json": {
      const appId = url.split(".")[1];
      return {
        brickPackages: [],
        storyboards: [
          {
            app: {
              id: appId,
              name: `App ${appId[appId.length - 1].toUpperCase()}`,
            },
          },
        ],
      };
    }
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
    case "/sa-static/app-c/versions/1.2.3/conf.yaml":
      return "a: b: c";
    case "app-d/conf.yaml":
    case "app-e/conf.yaml":
      return `
user_config_by_apps:
  app-d:
    y: 1
`;
    case "app-f/conf.yaml":
      return "{}";
  }
  throw new Error("Url not found");
});

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
            menuIcon: {
              imgSrc:
                "api/gateway/object_store.object_store.GetObject/api/v1/objectStore/bucket/next-builder/object/test.jpeg",
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
    expect(registerMocks).toBeCalledTimes(1);

    expect(data.storyboards[0]).toEqual({
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
          runtimeUserConf: 9,
        },
        config: {
          defaultConf: 7,
          userConf: 8,
          runtimeUserConf: 9,
        },
        menuIcon: {
          imgSrc: "/app-a/-/micro-apps/app-a/images/test.jpeg",
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
            userConfig: {
              x: true,
            },
            menuIcon: {
              imgSrc: "http://example.com",
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

  test("standalone with invalid conf.yaml", async () => {
    consoleWarn.mockReturnValueOnce();
    consoleError.mockReturnValueOnce();
    mockRuntimeMicroAppStandalone.mockRejectedValueOnce(new Error("oops"));
    window.STANDALONE_MICRO_APPS = true;
    window.BOOTSTRAP_FILE = "bootstrap.app-c.json";
    window.APP_ROOT = "/sa-static/app-c/versions/1.2.3/";
    const promise = loadBootstrapData();
    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Invalid conf.yaml"`
    );
    expect(consoleWarn).toBeCalledTimes(1);
    expect(consoleError).toBeCalledTimes(1);
  });

  test("standalone with conf.yaml of user_config_by_apps", async () => {
    consoleWarn.mockReturnValueOnce();
    mockRuntimeStandalone.mockRejectedValueOnce(new Error("oops"));
    window.STANDALONE_MICRO_APPS = true;
    window.BOOTSTRAP_FILE = "bootstrap.app-d.json";
    window.APP_ROOT = "app-d/";
    const promise = loadBootstrapData();
    const data = await promise;
    expect(data).toEqual({
      brickPackages: [],
      storyboards: [
        {
          app: {
            id: "app-d",
            name: "App D",
            userConfig: {
              y: 1,
            },
          },
        },
      ],
    });
    expect(consoleWarn).toBeCalledTimes(1);
  });

  test("standalone with conf.yaml of missing in user_config_by_apps", async () => {
    consoleWarn.mockReturnValue();
    mockRuntimeStandalone.mockRejectedValueOnce(new Error("oops"));
    mockRuntimeMicroAppStandalone.mockRejectedValueOnce(new Error("oops"));
    window.STANDALONE_MICRO_APPS = true;
    window.BOOTSTRAP_FILE = "bootstrap.app-e.json";
    window.APP_ROOT = "app-e/";
    const promise = loadBootstrapData();
    const data = await promise;
    expect(data).toEqual({
      brickPackages: [],
      storyboards: [
        {
          app: {
            id: "app-e",
            name: "App E",
          },
        },
      ],
    });
    expect(consoleWarn).toBeCalledTimes(1);
    await fulfilStoryboard(data.storyboards[0]);
    expect(consoleWarn).toBeCalledTimes(2);
    consoleWarn.mockReset();
  });

  test("standalone with conf.yaml of empty", async () => {
    consoleWarn.mockReturnValueOnce();
    mockRuntimeStandalone.mockRejectedValueOnce(new Error("oops"));
    window.NO_AUTH_GUARD = true;
    window.STANDALONE_MICRO_APPS = true;
    window.BOOTSTRAP_FILE = "bootstrap.app-f.json";
    window.APP_ROOT = "app-f/";
    const promise = loadBootstrapData();
    const data = await promise;
    expect(data).toEqual({
      brickPackages: [],
      storyboards: [
        {
          app: {
            id: "app-f",
            name: "App F",
          },
        },
      ],
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
          },
        },
      ],
    });

    await fulfilStoryboard(data.storyboards[0]);
    expect(mockGetAppStoryboardV2).toBeCalledTimes(1);

    expect(data.storyboards[0]).toEqual({
      app: {
        id: "app-a",
        name: "App A",
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
