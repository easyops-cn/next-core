import { jest, describe, test, expect } from "@jest/globals";
import { RuntimeApi_searchMicroAppStandalone } from "@next-api-sdk/micro-app-standalone-sdk";
import {
  preCheckInstalledApps,
  waitForCheckingApps,
  getCheckedApp,
} from "./checkInstalledApps.js";

jest.mock("@next-api-sdk/micro-app-standalone-sdk");
const consoleError = jest.spyOn(console, "error");

(
  RuntimeApi_searchMicroAppStandalone as jest.Mocked<
    typeof RuntimeApi_searchMicroAppStandalone
  >
).mockImplementation((data) => {
  const appIds = (data.query?.appId.$in as string[]).filter(
    (appId) => appId !== "app-x" && appId !== "app-y"
  );
  if (appIds.length === 0) {
    return Promise.reject(new Error("oops"));
  }
  return Promise.resolve({
    list: appIds.map((appId) => ({
      appId,
    })),
  });
});

const doesNotHaveAppInBootstrap = () => false;

describe("checkInstalledApps", () => {
  beforeEach(() => {
    window.STANDALONE_MICRO_APPS = true;
  });

  test("general", async () => {
    preCheckInstalledApps(
      {
        app: null!,
        routes: [
          {
            path: "${APP.homepage}",
            if: "<% INSTALLED_APPS.has('app-a') && INSTALLED_APPS.has('app-x') && INSTALLED_APPS.has('app-b', '>=1.2.3') %>",
            bricks: [],
          },
        ],
      },
      doesNotHaveAppInBootstrap
    );
    preCheckInstalledApps(
      {
        app: null!,
        routes: [
          {
            path: "${APP.homepage}",
            if: "<% INSTALLED_APPS.has('app-a') %>",
            bricks: [],
          },
        ],
      },
      doesNotHaveAppInBootstrap
    );
    await waitForCheckingApps(["app-a", "app-b", "app-x"]);
    expect(RuntimeApi_searchMicroAppStandalone).toBeCalledTimes(1);
    expect(getCheckedApp("app-a")).toEqual({
      appId: "app-a",
      id: "app-a",
    });
    expect(getCheckedApp("app-b")).toEqual({
      appId: "app-b",
      id: "app-b",
    });
    expect(getCheckedApp("app-x")).toEqual(undefined);
  });

  test("non-standalone", async () => {
    window.STANDALONE_MICRO_APPS = false;
    preCheckInstalledApps(
      {
        app: null!,
        routes: [
          {
            path: "${APP.homepage}",
            if: "<% INSTALLED_APPS.has('app-z') %>",
            bricks: [],
          },
        ],
      },
      doesNotHaveAppInBootstrap
    );
    await waitForCheckingApps(["app-z"]);
    expect(RuntimeApi_searchMicroAppStandalone).toBeCalledTimes(0);
    expect(getCheckedApp("app-y")).toBe(undefined);
  });

  test("catch api error", async () => {
    consoleError.mockReturnValueOnce();
    preCheckInstalledApps(
      {
        app: null!,
        routes: [
          {
            path: "${APP.homepage}",
            if: "<% INSTALLED_APPS.has('app-y') %>",
            bricks: [],
          },
        ],
      },
      doesNotHaveAppInBootstrap
    );
    await waitForCheckingApps(["app-y"]);
    expect(RuntimeApi_searchMicroAppStandalone).toBeCalledTimes(1);
    expect(getCheckedApp("app-y")).toBe(undefined);
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith(
      expect.stringContaining("failed"),
      expect.any(Error)
    );
  });
});
