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
  let validatePermissions: typeof _validatePermissions;
  let resetPermissionPreChecks: typeof _resetPermissionPreChecks;

  beforeEach(() => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const m = require("./getStandaloneInstalledApps");
      preFetchStandaloneInstalledApps = m.preFetchStandaloneInstalledApps;
      getStandaloneInstalledApps = m.getStandaloneInstalledApps;
      // validatePermissions = m.validatePermissions;
      // resetPermissionPreChecks = m.resetPermissionPreChecks;
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
        { appId: "appA", version: "1.0.1" },
        { appId: "appB", version: "1.0.1" },
      ],
      total: 2,
    });
    await preFetchStandaloneInstalledApps(null);
    expect(mockSearchMicroAppStandalone).toBeCalledWith({
      query: { isActiveVersion: true, appId: { $in: ["appA", "appB"] } },
      fields: ["appId", "version"],
    });
    expect(getStandaloneInstalledApps()).toEqual([
      { id: "appA", currentVersion: "1.0.1", installStatus: "ok" },
      { id: "appB", currentVersion: "1.0.1", installStatus: "ok" },
    ]);
  });

  it("should not search duplicate apps", async () => {
    // first time
    mockScanInstalledAppsInStoryboard.mockReturnValueOnce(["appA", "appB"]);
    mockSearchMicroAppStandalone.mockResolvedValueOnce({
      list: [
        { appId: "appA", version: "1.0.1" },
        { appId: "appB", version: "1.0.1" },
      ],
      total: 2,
    });
    await preFetchStandaloneInstalledApps(null);
    expect(mockSearchMicroAppStandalone).toBeCalledWith({
      query: { isActiveVersion: true, appId: { $in: ["appA", "appB"] } },
      fields: ["appId", "version"],
    });

    // second time
    mockScanInstalledAppsInStoryboard.mockReturnValueOnce(["appB", "appC"]);
    mockSearchMicroAppStandalone.mockResolvedValueOnce({
      list: [{ appId: "appC", version: "1.0.2" }],
      total: 2,
    });
    await preFetchStandaloneInstalledApps(null);
    expect(mockSearchMicroAppStandalone).toBeCalledWith({
      query: { isActiveVersion: true, appId: { $in: ["appC"] } },
      fields: ["appId", "version"],
    });

    // expect return A B C
    expect(getStandaloneInstalledApps()).toEqual([
      { id: "appA", currentVersion: "1.0.1", installStatus: "ok" },
      { id: "appB", currentVersion: "1.0.1", installStatus: "ok" },
      { id: "appC", currentVersion: "1.0.2", installStatus: "ok" },
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
