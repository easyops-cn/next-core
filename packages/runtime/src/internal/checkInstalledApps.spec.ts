import { jest, describe, test, expect } from "@jest/globals";
import { RuntimeApi_searchMicroAppStandalone } from "@next-api-sdk/micro-app-standalone-sdk";
import {
  hasInstalledApp,
  preCheckInstalledApps,
  waitForCheckingApps,
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
      currentVersion: appId === "app-a" ? "" : "1.2.3",
      installStatus: "ok",
    })),
  });
});

describe("checkInstalledApps", () => {
  beforeEach(() => {
    window.STANDALONE_MICRO_APPS = true;
  });

  test("general", async () => {
    consoleError.mockReturnValueOnce();
    preCheckInstalledApps({
      app: null!,
      routes: [
        {
          path: "${APP.homepage}",
          if: "<% INSTALLED_APPS.has('app-a') && INSTALLED_APPS.has('app-x') && INSTALLED_APPS.has('app-b', '>=1.2.3') %>",
          bricks: [],
        },
      ],
    });
    preCheckInstalledApps({
      app: null!,
      routes: [
        {
          path: "${APP.homepage}",
          if: "<% INSTALLED_APPS.has('app-a') %>",
          bricks: [],
        },
      ],
    });
    await waitForCheckingApps(["app-a", "app-b", "app-x"]);
    expect(RuntimeApi_searchMicroAppStandalone).toBeCalledTimes(1);
    expect(hasInstalledApp("app-a")).toBe(true);
    expect(hasInstalledApp("app-a", ">=2.3.4")).toBe(true);
    expect(hasInstalledApp("app-b")).toBe(true);
    expect(hasInstalledApp("app-b", ">=1.2.3")).toBe(true);
    expect(hasInstalledApp("app-b", ">=2.3.4")).toBe(false);
    expect(hasInstalledApp("app-x")).toBe(false);
    hasInstalledApp("app-b", "^1.2.3");
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith(expect.any(TypeError));
  });

  test("non-standalone", async () => {
    window.STANDALONE_MICRO_APPS = false;
    preCheckInstalledApps({
      app: null!,
      routes: [
        {
          path: "${APP.homepage}",
          if: "<% INSTALLED_APPS.has('app-z') %>",
          bricks: [],
        },
      ],
    });
    await waitForCheckingApps(["app-z"]);
    expect(RuntimeApi_searchMicroAppStandalone).toBeCalledTimes(0);
    expect(hasInstalledApp("app-y")).toBe(false);
  });

  test("catch api error", async () => {
    consoleError.mockReturnValueOnce();
    preCheckInstalledApps({
      app: null!,
      routes: [
        {
          path: "${APP.homepage}",
          if: "<% INSTALLED_APPS.has('app-y') %>",
          bricks: [],
        },
      ],
    });
    await waitForCheckingApps(["app-y"]);
    expect(RuntimeApi_searchMicroAppStandalone).toBeCalledTimes(1);
    expect(hasInstalledApp("app-y")).toBe(false);
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith(
      expect.stringContaining("failed"),
      expect.any(Error)
    );
  });
});
