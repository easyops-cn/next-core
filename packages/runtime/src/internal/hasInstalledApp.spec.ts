import { jest, describe, test, expect } from "@jest/globals";
import { hasInstalledApp } from "./hasInstalledApp.js";

jest.mock("./Runtime.js", () => ({
  _internalApiGetAppInBootstrapData(appId: string) {
    if (appId === "app-x") {
      return {
        appId: "app-x",
        id: "app-x",
      };
    }
  },
  hooks: {
    checkInstalledApps: {
      getCheckedApp(appId: string) {
        if (appId === "app-a") {
          return {
            appId: "app-a",
            id: "app-a",
            installStatus: "ok",
            currentVersion: "",
          };
        }
        if (appId === "app-b") {
          return {
            appId: "app-b",
            id: "app-b",
            currentVersion: "1.2.3",
          };
        }
      },
    },
  },
}));

const consoleError = jest.spyOn(console, "error");

describe("hasInstalledApp", () => {
  beforeEach(() => {
    window.STANDALONE_MICRO_APPS = true;
  });

  test("general", async () => {
    expect(hasInstalledApp("app-a")).toBe(true);
    expect(hasInstalledApp("app-a", ">=2.3.4")).toBe(true);
    expect(hasInstalledApp("app-b")).toBe(true);
    expect(hasInstalledApp("app-b", ">=1.2.3")).toBe(true);
    expect(hasInstalledApp("app-b", ">=2.3.4")).toBe(false);
    expect(hasInstalledApp("app-x")).toBe(true);
    expect(hasInstalledApp("app-y")).toBe(false);
  });

  test("Invalid match version", () => {
    consoleError.mockReturnValueOnce();
    expect(hasInstalledApp("app-b", "^1.2.3")).toBe(false);
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith(expect.any(TypeError));
  });
});
