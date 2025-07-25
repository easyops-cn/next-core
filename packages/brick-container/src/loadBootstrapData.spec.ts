import { jest, describe, test, expect } from "@jest/globals";
import { i18n } from "@next-core/i18n";
import { http } from "@next-core/http";
import {
  BootstrapStandaloneApi_runtimeStandalone,
  BootstrapV2Api_bootstrapV2,
  BootstrapV2Api_getAppStoryboardV2,
} from "@next-api-sdk/api-gateway-sdk";
import { RuntimeApi_runtimeMicroAppStandalone } from "@next-api-sdk/micro-app-standalone-sdk";
import { fulfilStoryboard, loadBootstrapData } from "./loadBootstrapData.js";
import { registerMocks } from "./mocks.js";

i18n.init({
  fallbackLng: "en",
});
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
const blackList = [{ url: "/test" }];
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
  blackList,
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
                zh: {
                  name: "应用 A",
                },
                en: {
                  name: "Application A",
                },
              },
              defaultConfig: {
                defaultConf: 7,
                array: [1, 2],
              },
              userConfig: {
                __merge_method: "override",
                userConf: 8,
                array: [3],
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
    case "sa-static/app/-/bootstrap.mini.a.json":
    case "sa-static/micro-apps/v3/union-app/1.92.0/bootstrap.mini.a.json":
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
            },
            meta: {},
            routes: [],
          },
        ],
      };
    case "bootstrap.mini.g.json":
      return {
        brickPackages: [],
        storyboards: [
          {
            app: {
              id: "app-g",
              name: "App G",
              homepage: "/app-g",
              locales: {
                zh: { name: "应用 G" },
                en: { name: "Application G" },
              },
              currentVersion: "1.1.1",
            },
            meta: {},
            routes: [
              {
                path: "${app.homepage}/test",
              },
            ],
          },
        ],
      };
    case "bootstrap.app-h.json":
      return {
        brickPackages: [],
        storyboards: [
          {
            app: {
              id: "app-h",
              name: "App H",
              locales: {
                zh: {
                  name: "应用 H",
                },
                en: {
                  name: "Application H",
                },
              },
              defaultConfig: {
                defaultConf: 7,
              },
              userConfig: {
                userConf: 8,
                settings: {
                  locales: {
                    zh: { name: "应用 H 别名", title: "你好 H" },
                    en: { name: "Application H Alias", title: "Hi there H" },
                  },
                },
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
    case "bootstrap-union.cmdb.abg.json":
      return {
        brickPackages: [],
        storyboards: [
          {
            app: {
              id: "app-a",
              name: "App A",
              homepage: "/app-a",
              locales: {
                zh: { name: "应用 A" },
                en: { name: "Application A" },
              },
            },
            bootstrapFile: "bootstrap.mini.a.json",
          },
          {
            app: {
              id: "app-b",
              homepage: "/app-b",
              name: "App B",
            },
            bootstrapFile: "bootstrap.mini.b.json",
          },
          {
            app: {
              id: "app-g",
              name: "App G",
              homepage: "/app-g",
              locales: {
                zh: { name: "应用 G" },
                en: { name: "Application G" },
              },
            },
            bootstrapFile: "bootstrap.mini.g.json",
          },
        ],
      };
    case "sa-static/app-a/versions/1.88.0/webroot/conf.yaml":
    case "sa-static/app-h/versions/1.88.0/webroot/conf.yaml":
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
    delete window.BOOTSTRAP_UNION_FILE;
    delete window.APP_ID;
    delete window.APP_ROOT;
  });

  test("standalone", async () => {
    window.STANDALONE_MICRO_APPS = true;
    window.BOOTSTRAP_FILE = "bootstrap.app-a.json";
    window.APP_ROOT = "sa-static/app-a/versions/1.88.0/webroot/";
    const promise = loadBootstrapData();
    expect(RuntimeApi_runtimeMicroAppStandalone).toHaveBeenCalledWith("app-a", {
      version: "1.88.0",
    });
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
              array: [1, 2],
            },
            userConfig: {
              __merge_method: "override",
              userConf: 8,
              array: [3],
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
    expect(RuntimeApi_runtimeMicroAppStandalone).toHaveBeenCalledTimes(1);
    expect(registerMocks).toHaveBeenCalledTimes(1);

    expect(data.storyboards[0]).toEqual({
      app: {
        id: "app-a",
        name: "App A",
        localeName: "Application A",
        localeTitle: "",
        locales: {
          zh: { name: "应用 A" },
          en: { name: "Application A" },
        },
        defaultConfig: {
          defaultConf: 7,
          array: [1, 2],
        },
        userConfig: {
          __merge_method: "override",
          userConf: 8,
          array: [3],
          runtimeUserConf: 9,
        },
        config: {
          __merge_method: "override",
          defaultConf: 7,
          userConf: 8,
          runtimeUserConf: 9,
          array: [3],
        },
        menuIcon: {
          imgSrc:
            "/sa-static/app-a/versions/1.88.0/webroot/-/micro-apps/app-a/images/test.jpeg",
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
              localeName: undefined,
              localeTitle: "",
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
        blackList,
      },
    });
  });

  test("standalone with legacy union app", async () => {
    window.STANDALONE_MICRO_APPS = true;
    window.BOOTSTRAP_UNION_FILE = "bootstrap-union.cmdb.abg.json";
    window.APP_ROOT = "sa-static/app/";
    window.BOOTSTRAP_FILE = "bootstrap.mini.g.json";

    const promise = loadBootstrapData();
    expect(RuntimeApi_runtimeMicroAppStandalone).not.toHaveBeenCalled();

    const data = await promise;
    expect(data).toEqual({
      brickPackages: [],
      settings: {
        featureFlags: { "runtime-flag": true },
        homepage: "/runtime/homepage",
        misc: { runtimeMisc: 2 },
      },
      storyboards: [
        {
          app: {
            homepage: "/app-a",
            id: "app-a",
            locales: { en: { name: "Application A" }, zh: { name: "应用 A" } },
            name: "App A",
          },
          bootstrapFile: "bootstrap.mini.a.json",
        },
        {
          app: { homepage: "/app-b", id: "app-b", name: "App B" },
          bootstrapFile: "bootstrap.mini.b.json",
        },
        {
          $$fullMerged: true,
          app: {
            homepage: "/app-g",
            id: "app-g",
            locales: { en: { name: "Application G" }, zh: { name: "应用 G" } },
            name: "App G",
            currentVersion: "1.1.1",
          },
          bootstrapFile: "bootstrap.mini.g.json",
          meta: {},
          routes: [{ path: "${app.homepage}/test" }],
        },
      ],
    });

    await fulfilStoryboard(data.storyboards[2]);

    expect(RuntimeApi_runtimeMicroAppStandalone).toHaveBeenCalledWith("app-g", {
      version: "1.1.1",
    });

    expect(data.storyboards[2]).toEqual({
      $$fullMerged: true,
      app: {
        config: { runtimeUserConf: 9 },
        homepage: "/app-g",
        id: "app-g",
        localeName: "Application G",
        localeTitle: "",
        locales: { en: { name: "Application G" }, zh: { name: "应用 G" } },
        name: "App G",
        userConfig: { runtimeUserConf: 9 },
        currentVersion: "1.1.1",
      },
      bootstrapFile: "bootstrap.mini.g.json",
      meta: {
        injectMenus: [
          { title: "Menu 1" },
          {
            overrideApp: {
              config: { overrideDefault: 4, overrideUser: 5 },
              localeName: undefined,
              localeTitle: "",
              defaultConfig: { overrideDefault: 4 },
              userConfig: { overrideUser: 5 },
            },
            title: "Menu 2",
          },
        ],
        blackList,
      },
      routes: [{ path: "${app.homepage}/test" }],
    });

    await fulfilStoryboard(data.storyboards[0]);

    expect(data.storyboards[0]).toEqual({
      $$fullMerged: true,
      app: {
        config: { runtimeUserConf: 9 },
        homepage: "/app-a",
        id: "app-a",
        localeName: "Application A",
        localeTitle: "",
        locales: { en: { name: "Application A" }, zh: { name: "应用 A" } },
        name: "App A",
        userConfig: { runtimeUserConf: 9 },
      },
      bootstrapFile: "bootstrap.mini.a.json",
      meta: {
        injectMenus: [
          { title: "Menu 1" },
          {
            overrideApp: {
              config: { overrideDefault: 4, overrideUser: 5 },
              localeName: undefined,
              localeTitle: "",
              defaultConfig: { overrideDefault: 4 },
              userConfig: { overrideUser: 5 },
            },
            title: "Menu 2",
          },
        ],
        blackList,
      },
      routes: [],
    });
  });

  test("standalone with new union app", async () => {
    window.STANDALONE_MICRO_APPS = true;
    window.BOOTSTRAP_UNION_FILE = "bootstrap-union.cmdb.abg.json";
    window.APP_ROOT = "sa-static/micro-apps/v3/union-app/1.92.0/";
    window.BOOTSTRAP_FILE = "bootstrap.mini.g.json";
    window.PUBLIC_DEPS = [
      {
        bricks: [
          "frame-bricks.side-bar",
          "frame-bricks.nav-menu",
          "frame-bricks.drop-menu",
        ],
        processors: [],
        providers: [],
        dll: [],
        filePath: "bricks/frame-bricks/-/dist/index.a6deb0c8.js",
      },
    ];

    const promise = loadBootstrapData();
    expect(RuntimeApi_runtimeMicroAppStandalone).toHaveBeenLastCalledWith(
      "union-app",
      { version: "1.92.0" }
    );

    const data = await promise;
    expect(data).toEqual({
      brickPackages: [],
      settings: {
        featureFlags: { "runtime-flag": true },
        homepage: "/runtime/homepage",
        misc: { runtimeMisc: 2 },
      },
      storyboards: [
        {
          app: {
            homepage: "/app-a",
            id: "app-a",
            locales: { en: { name: "Application A" }, zh: { name: "应用 A" } },
            name: "App A",
          },
          bootstrapFile: "bootstrap.mini.a.json",
        },
        {
          app: { homepage: "/app-b", id: "app-b", name: "App B" },
          bootstrapFile: "bootstrap.mini.b.json",
        },
        {
          $$fullMerged: true,
          app: {
            homepage: "/app-g",
            id: "app-g",
            locales: { en: { name: "Application G" }, zh: { name: "应用 G" } },
            name: "App G",
            currentVersion: "1.1.1",
          },
          bootstrapFile: "bootstrap.mini.g.json",
          meta: {},
          routes: [{ path: "${app.homepage}/test" }],
        },
      ],
    });

    await fulfilStoryboard(data.storyboards[2]);

    expect(data.storyboards[2]).toEqual({
      $$fullMerged: true,
      app: {
        config: { runtimeUserConf: 9 },
        homepage: "/app-g",
        id: "app-g",
        localeName: "Application G",
        localeTitle: "",
        locales: { en: { name: "Application G" }, zh: { name: "应用 G" } },
        name: "App G",
        userConfig: { runtimeUserConf: 9 },
        currentVersion: "1.1.1",
      },
      bootstrapFile: "bootstrap.mini.g.json",
      meta: {
        injectMenus: [
          { title: "Menu 1" },
          {
            overrideApp: {
              config: { overrideDefault: 4, overrideUser: 5 },
              localeName: undefined,
              localeTitle: "",
              defaultConfig: { overrideDefault: 4 },
              userConfig: { overrideUser: 5 },
            },
            title: "Menu 2",
          },
        ],
        blackList,
      },
      routes: [{ path: "${app.homepage}/test" }],
    });

    await fulfilStoryboard(data.storyboards[0]);

    expect(data.storyboards[0]).toEqual({
      $$fullMerged: true,
      app: {
        config: { runtimeUserConf: 9 },
        homepage: "/app-a",
        id: "app-a",
        localeName: "Application A",
        localeTitle: "",
        locales: { en: { name: "Application A" }, zh: { name: "应用 A" } },
        name: "App A",
        userConfig: { runtimeUserConf: 9 },
      },
      bootstrapFile: "bootstrap.mini.a.json",
      meta: {
        injectMenus: [
          { title: "Menu 1" },
          {
            overrideApp: {
              config: { overrideDefault: 4, overrideUser: 5 },
              localeName: undefined,
              localeTitle: "",
              defaultConfig: { overrideDefault: 4 },
              userConfig: { overrideUser: 5 },
            },
            title: "Menu 2",
          },
        ],
        blackList,
      },
      routes: [],
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
    expect(consoleWarn).toHaveBeenCalledTimes(1);
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
    expect(consoleWarn).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledTimes(1);
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
    expect(consoleWarn).toHaveBeenCalledTimes(1);
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
    expect(consoleWarn).toHaveBeenCalledTimes(1);
    await fulfilStoryboard(data.storyboards[0]);
    expect(consoleWarn).toHaveBeenCalledTimes(2);
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
    expect(consoleWarn).toHaveBeenCalledTimes(1);
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
    expect(mockGetAppStoryboardV2).toHaveBeenCalledTimes(1);

    expect(data.storyboards[0]).toEqual({
      app: {
        id: "app-a",
        name: "App A",
        localeName: "App A",
        localeTitle: "",
        userConfig: {
          userConf: 42,
        },
        config: {
          userConf: 42,
        },
      },
      meta: undefined,
      routes: [],
    });
  });

  test("standalone with locales", async () => {
    window.STANDALONE_MICRO_APPS = true;
    window.BOOTSTRAP_FILE = "bootstrap.app-h.json";
    window.APP_ROOT = "sa-static/app-h/versions/1.88.0/webroot/";
    const promise = loadBootstrapData();
    const data = await promise;
    await fulfilStoryboard(data.storyboards[0]);

    expect(data.storyboards[0]).toEqual({
      app: {
        id: "app-h",
        name: "App H",
        localeTitle: "Hi there H",
        locales: { zh: { name: "应用 H" }, en: { name: "Application H" } },
        defaultConfig: { defaultConf: 7 },
        userConfig: {
          userConf: 8,
          settings: {
            locales: {
              zh: { name: "应用 H 别名", title: "你好 H" },
              en: { name: "Application H Alias", title: "Hi there H" },
            },
          },
        },
        config: {
          defaultConf: 7,
          userConf: 8,
          settings: {
            locales: {
              zh: { name: "应用 H 别名", title: "你好 H" },
              en: { name: "Application H Alias", title: "Hi there H" },
            },
          },
        },
        localeName: "Application H Alias",
      },
    });
  });
});
