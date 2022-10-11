import { scanInstalledAppsInStoryboard } from "@next-core/brick-utils";
import { RuntimeApi_searchMicroAppStandalone } from "@next-sdk/micro-app-standalone-sdk";

import {
  preCheckPermissions as _preCheckPermissions,
  checkPermissions as _checkPermissions,
  validatePermissions as _validatePermissions,
  resetPermissionPreChecks as _resetPermissionPreChecks,
} from "./checkPermissions";
import { getAuth } from "../auth";
import {
  getStandaloneInstalledApps as _getStandaloneInstalledApps,
  preFetchStandaloneInstalledApps as _preFetchStandaloneInstalledApps,
} from "./getStandaloneInstalledApps";

jest.mock("@next-core/brick-utils");
jest.mock("@next-sdk/micro-app-standalone-sdk");
jest.mock("../auth.ts");

const mockGetAuth = (getAuth as jest.Mock).mockReturnValue({});

const mockScanInstalledAppsInStoryboard =
  scanInstalledAppsInStoryboard as jest.MockedFunction<
    typeof scanInstalledAppsInStoryboard
  >;
const mockSearchMicroAppStandalone =
  RuntimeApi_searchMicroAppStandalone as jest.MockedFunction<
    typeof RuntimeApi_searchMicroAppStandalone
  >;
const mockConsoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => void 0);

describe("preFetchInstalledMicroApp", () => {
  let preFetchStandaloneInstalledApps: typeof _preFetchStandaloneInstalledApps;
  let getStandaloneInstalledApps: typeof _getStandaloneInstalledApps;

  beforeEach(() => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const m = require("./getStandaloneInstalledApps");
      preFetchStandaloneInstalledApps = m.preFetchStandaloneInstalledApps;
      getStandaloneInstalledApps = m.getStandaloneInstalledApps;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should not request if app ids is empty", async () => {
    mockScanInstalledAppsInStoryboard.mockReturnValueOnce([]);
    await preFetchStandaloneInstalledApps(null);
    expect(mockSearchMicroAppStandalone).not.toBeCalled();
    expect(getStandaloneInstalledApps()).toEqual([]);
  });

  it("should search and get standalone app success", async () => {
    mockScanInstalledAppsInStoryboard.mockReturnValueOnce(["appA", "appB"]);
    mockSearchMicroAppStandalone.mockResolvedValueOnce({
      list: [
        { appId: "appA", currentVersion: "1.0.1", installStatus: "ok" },
        { appId: "appB", currentVersion: "1.0.1", installStatus: "ok" },
      ],
      total: 2,
    });
    await preFetchStandaloneInstalledApps(null);
    expect(mockSearchMicroAppStandalone).toBeCalledWith({
      query: { appId: { $in: ["appA", "appB"] } },
      fields: ["appId", "currentVersion", "installStatus"],
    });
    expect(getStandaloneInstalledApps()).toEqual([
      {
        id: "appA",
        appId: "appA",
        currentVersion: "1.0.1",
        installStatus: "ok",
      },
      {
        id: "appB",
        appId: "appB",
        currentVersion: "1.0.1",
        installStatus: "ok",
      },
    ]);
  });

  it("should not search duplicate apps", async () => {
    // first time
    mockScanInstalledAppsInStoryboard.mockReturnValueOnce(["appA", "appB"]);
    mockSearchMicroAppStandalone.mockResolvedValueOnce({
      list: [
        { appId: "appA", currentVersion: "1.0.1", installStatus: "ok" },
        { appId: "appB", currentVersion: "1.0.1", installStatus: "ok" },
      ],
      total: 2,
    });
    await preFetchStandaloneInstalledApps(null);
    expect(mockSearchMicroAppStandalone).toBeCalledWith({
      query: { appId: { $in: ["appA", "appB"] } },
      fields: ["appId", "currentVersion", "installStatus"],
    });

    // second time
    mockScanInstalledAppsInStoryboard.mockReturnValueOnce(["appB", "appC"]);
    mockSearchMicroAppStandalone.mockResolvedValueOnce({
      list: [{ appId: "appC", currentVersion: "1.0.2", installStatus: "ok" }],
      total: 2,
    });
    await preFetchStandaloneInstalledApps(null);
    expect(mockSearchMicroAppStandalone).toBeCalledWith({
      query: { appId: { $in: ["appC"] } },
      fields: ["appId", "currentVersion", "installStatus"],
    });

    // expect return A B C
    expect(getStandaloneInstalledApps()).toEqual([
      {
        id: "appA",
        appId: "appA",
        currentVersion: "1.0.1",
        installStatus: "ok",
      },
      {
        id: "appB",
        appId: "appB",
        currentVersion: "1.0.1",
        installStatus: "ok",
      },
      {
        id: "appC",
        appId: "appC",
        currentVersion: "1.0.2",
        installStatus: "ok",
      },
    ]);
  });

  it("should catch error if search failed", async () => {
    mockScanInstalledAppsInStoryboard.mockReturnValueOnce(["appA", "appB"]);
    mockSearchMicroAppStandalone.mockRejectedValueOnce("something went wrong");
    await preFetchStandaloneInstalledApps(null);
    expect(mockConsoleError).toBeCalledWith(
      "get off site standalone micro app failed",
      "something went wrong"
    );
  });
});
