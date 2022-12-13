import { http } from "@next-core/brick-http";
import { BootstrapData } from "@next-core/brick-types";
import {
  safeGetRuntimeMicroAppStandalone,
  standaloneBootstrap,
} from "./standaloneBootstrap";
import {
  BootstrapStandaloneApi_runtimeStandalone,
  BootstrapStandaloneApi_RuntimeStandaloneResponseBody,
} from "@next-sdk/api-gateway-sdk";
import { RuntimeApi_runtimeMicroAppStandalone } from "@next-sdk/micro-app-standalone-sdk";

const mockHttpGet = jest.spyOn(http, "get");

jest.mock("@next-sdk/api-gateway-sdk");
jest.mock("@next-sdk/micro-app-standalone-sdk");

window.BOOTSTRAP_FILE = "-/bootstrap.json";
const consoleWarn = jest.spyOn(console, "warn").mockImplementation();

const mockRuntimeStandalone =
  BootstrapStandaloneApi_runtimeStandalone as jest.MockedFunction<
    typeof BootstrapStandaloneApi_runtimeStandalone
  >;
const mockRuntimeMicroAppStandalone =
  RuntimeApi_runtimeMicroAppStandalone as jest.MockedFunction<
    typeof RuntimeApi_runtimeMicroAppStandalone
  >;

describe("standaloneBootstrap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.APP_ID = undefined;
    window.APP_ROOT = "";
    window.NO_AUTH_GUARD = false;
  });

  it.each<
    [
      desc: string,
      rawBootstrap: RecursivePartial<BootstrapData>,
      confString: string,
      runtimeApiReturn:
        | BootstrapStandaloneApi_RuntimeStandaloneResponseBody
        | string,
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
    [
      "should work when runtime api failed",
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
      "oops",
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
  ])("%s", async (desc, rawBootstrap, confString, runtimeApiReturn, result) => {
    if (runtimeApiReturn === "oops") {
      mockRuntimeStandalone.mockRejectedValueOnce(runtimeApiReturn);
    } else {
      mockRuntimeStandalone.mockResolvedValueOnce(
        runtimeApiReturn as BootstrapStandaloneApi_RuntimeStandaloneResponseBody
      );
    }
    mockHttpGet.mockImplementation((url) => {
      if (url === "conf.yaml") {
        return Promise.resolve(confString);
      }
      return Promise.resolve(rawBootstrap);
    });
    expect(await standaloneBootstrap()).toEqual(result);
    expect(consoleWarn).toBeCalledTimes(runtimeApiReturn === "oops" ? 1 : 0);
    expect(RuntimeApi_runtimeMicroAppStandalone).toBeCalledTimes(0);
  });

  it("should fire a request of RuntimeApi_runtimeMicroAppStandalone", async () => {
    window.APP_ID = "my-app";
    mockRuntimeStandalone.mockRejectedValueOnce("oops");
    mockRuntimeMicroAppStandalone.mockRejectedValueOnce("nope");
    const promise = standaloneBootstrap();
    mockHttpGet.mockResolvedValueOnce("");
    expect(RuntimeApi_runtimeMicroAppStandalone).toBeCalledWith("my-app");
    await promise;
  });

  it("should fire a request of RuntimeApi_runtimeMicroAppStandalone by APP_ROOT", async () => {
    window.APP_ROOT = "/next/sa-static/another-app/versions/1.2.3/webroot/";
    mockRuntimeStandalone.mockResolvedValueOnce({});
    mockRuntimeMicroAppStandalone.mockResolvedValueOnce({});
    const promise = standaloneBootstrap();
    mockHttpGet.mockResolvedValueOnce("");
    expect(RuntimeApi_runtimeMicroAppStandalone).toBeCalledWith("another-app");

    // No call more than once.
    safeGetRuntimeMicroAppStandalone("another-app");
    expect(RuntimeApi_runtimeMicroAppStandalone).toBeCalledTimes(1);
    await promise;
  });

  it("should not fire a request of RuntimeApi_runtimeMicroAppStandalone with NO_AUTH_GUARD", async () => {
    window.NO_AUTH_GUARD = true;
    window.APP_ID = "x-app";
    mockRuntimeStandalone.mockRejectedValueOnce("oops");
    mockRuntimeMicroAppStandalone.mockRejectedValueOnce("nope");
    const promise = standaloneBootstrap();
    // mockHttpGet.mockResolvedValueOnce("");
    expect(RuntimeApi_runtimeMicroAppStandalone).not.toBeCalled();
    await promise;
  });

  it("should throw error", async () => {
    mockRuntimeStandalone.mockResolvedValueOnce({ settings: {} });
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
