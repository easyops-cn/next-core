import {
  scanPermissionActionsInStoryboard,
  scanPermissionActionsInAny,
} from "@next-core/utils/storyboard";
import { PermissionApi_validatePermissions } from "@next-api-sdk/micro-app-sdk";
import {
  preCheckPermissions as _preCheckPermissions,
  preCheckPermissionsForBrickOrRoute as _preCheckPermissionsForBrickOrRoute,
  preCheckPermissionsForAny as _preCheckPermissionsForAny,
  checkPermissions as _checkPermissions,
  validatePermissions as _validatePermissions,
  resetPermissionPreChecks as _resetPermissionPreChecks,
} from "./checkPermissions.js";
import { isLoggedIn, getAuth } from "./auth.js";

jest.mock("@next-core/utils/storyboard");
jest.mock("@next-api-sdk/micro-app-sdk");
jest.mock("./auth.js");

const mockIsLoggedIn = (isLoggedIn as jest.Mock).mockReturnValue(true);
const mockGetAuth = (getAuth as jest.Mock).mockReturnValue({});

const mockScanPermissionActionsInStoryboard =
  scanPermissionActionsInStoryboard as jest.MockedFunction<
    typeof scanPermissionActionsInStoryboard
  >;
const mockScanPermissionActionsInAny =
  scanPermissionActionsInAny as jest.MockedFunction<
    typeof scanPermissionActionsInAny
  >;
const mockValidatePermissions =
  PermissionApi_validatePermissions as jest.MockedFunction<
    typeof PermissionApi_validatePermissions
  >;
const mockConsoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => void 0);

describe("checkPermissions", () => {
  let preCheckPermissions: typeof _preCheckPermissions;
  let preCheckPermissionsForBrickOrRoute: typeof _preCheckPermissionsForBrickOrRoute;
  let preCheckPermissionsForAny: typeof _preCheckPermissionsForAny;
  let checkPermissions: typeof _checkPermissions;
  let validatePermissions: typeof _validatePermissions;
  let resetPermissionPreChecks: typeof _resetPermissionPreChecks;

  beforeEach(() => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const m = require("./checkPermissions");
      preCheckPermissions = m.preCheckPermissions;
      preCheckPermissionsForBrickOrRoute = m.preCheckPermissionsForBrickOrRoute;
      preCheckPermissionsForAny = m.preCheckPermissionsForAny;
      checkPermissions = m.checkPermissions;
      validatePermissions = m.validatePermissions;
      resetPermissionPreChecks = m.resetPermissionPreChecks;
    });
  });

  it("should not request if is not loggedIn", async () => {
    mockIsLoggedIn.mockReturnValue(false);
    await preCheckPermissions(null!);
    expect(mockValidatePermissions).not.toBeCalled();
    expect(checkPermissions("my:action-a")).toBe(false);
    expect(mockConsoleError).not.toBeCalled();
    mockIsLoggedIn.mockReturnValue(true);
  });

  it("should not request if action is empty", async () => {
    mockScanPermissionActionsInStoryboard.mockReturnValueOnce([]);
    await preCheckPermissions(null!);
    expect(mockValidatePermissions).not.toBeCalled();
    expect(checkPermissions("my:action-a")).toBe(false);
    expect(mockConsoleError).toBeCalledWith(
      'Un-checked permission action: "my:action-a", please make sure the permission to check is defined in permissionsPreCheck.'
    );
  });

  it("should catch error if pre-check failed", async () => {
    mockScanPermissionActionsInStoryboard.mockReturnValueOnce(["my:action-a"]);
    mockValidatePermissions.mockRejectedValueOnce("oops");
    await preCheckPermissions(null!);
    expect(mockConsoleError).toBeCalledWith(
      "Pre-check permissions failed",
      "oops"
    );
    expect(checkPermissions("my:action-a")).toBe(false);
    expect(mockConsoleError).toBeCalledWith(
      'Un-checked permission action: "my:action-a", please make sure the permission to check is defined in permissionsPreCheck.'
    );
  });

  it("should not check permissions repeatedly", async () => {
    mockValidatePermissions.mockResolvedValueOnce({
      actions: [
        {
          action: "my:action-a",
          authorizationStatus: "authorized",
        },
        {
          action: "my:action-b",
          authorizationStatus: "unauthorized",
        },
      ],
    });
    await validatePermissions(["my:action-a", "my:action-b"]);
    expect(mockValidatePermissions).toBeCalledWith({
      actions: ["my:action-a", "my:action-b"],
    });
    await validatePermissions(["my:action-a", "my:action-c"]);
    expect(mockValidatePermissions).toBeCalledWith({
      actions: ["my:action-c"],
    });
  });

  it("should validate permissions", async () => {
    mockScanPermissionActionsInStoryboard.mockReturnValueOnce([
      "my:action-a",
      "my:action-b",
      "my:action-c",
    ]);
    mockValidatePermissions.mockResolvedValueOnce({
      actions: [
        {
          action: "my:action-a",
          authorizationStatus: "authorized",
        },
        {
          action: "my:action-b",
          authorizationStatus: "unauthorized",
        },
        {
          action: "my:action-c",
          authorizationStatus: "undefined",
        },
      ],
    });
    await preCheckPermissions(null!);
    expect(mockValidatePermissions).toBeCalledWith({
      actions: ["my:action-a", "my:action-b", "my:action-c"],
    });
    expect(mockConsoleError).toBeCalledWith(
      'Undefined permission action: "my:action-c"'
    );

    mockValidatePermissions.mockClear();
    mockConsoleError.mockClear();

    mockScanPermissionActionsInStoryboard.mockReturnValueOnce([
      "my:action-c",
      "my:action-d",
    ]);
    mockValidatePermissions.mockResolvedValueOnce({
      actions: [
        {
          action: "my:action-d",
          authorizationStatus: "authorized",
        },
      ],
    });
    await preCheckPermissions(null!);
    expect(mockValidatePermissions).toBeCalledWith({
      actions: ["my:action-d"],
    });
    expect(mockConsoleError).not.toBeCalled();

    expect(checkPermissions("my:action-a")).toBe(true);
    expect(checkPermissions("my:action-b")).toBe(false);
    expect(checkPermissions("my:action-c")).toBe(false);
    expect(checkPermissions("my:action-d")).toBe(true);
    expect(checkPermissions("my:action-a", "my:action-b")).toBe(false);
    expect(checkPermissions("my:action-b", "my:action-c")).toBe(false);
    expect(checkPermissions("my:action-a", "my:action-d")).toBe(true);
    expect(mockConsoleError).not.toBeCalled();

    expect(checkPermissions("my:action-x")).toBe(false);
    expect(mockConsoleError).toBeCalledWith(
      'Un-checked permission action: "my:action-x", please make sure the permission to check is defined in permissionsPreCheck.'
    );
  });

  it("should permission always authorized if the role is system admin", () => {
    mockScanPermissionActionsInStoryboard.mockReturnValueOnce(["my:action-a"]);

    mockGetAuth.mockReturnValueOnce({ isAdmin: true });
    expect(checkPermissions("my:action-a")).toEqual(true);
  });

  it("should not request if is not loggedIn for brick", async () => {
    mockIsLoggedIn.mockReturnValue(false);
    await preCheckPermissionsForBrickOrRoute(null!, null!);
    expect(mockValidatePermissions).not.toBeCalled();
    expect(checkPermissions("my:action-a")).toBe(false);
    mockIsLoggedIn.mockReturnValue(true);
  });

  it("should work for brick", async () => {
    await preCheckPermissionsForBrickOrRoute(
      {
        permissionsPreCheck: [],
      } as any,
      (v) => Promise.resolve(v)
    );
    expect(mockValidatePermissions).not.toBeCalled();
    expect(checkPermissions("my:action-a")).toBe(false);
  });

  it("should not request if is not loggedIn for any", async () => {
    mockIsLoggedIn.mockReturnValue(false);
    await preCheckPermissionsForAny(null);
    expect(mockValidatePermissions).not.toBeCalled();
    expect(checkPermissions("my:action-a")).toBe(false);
    mockIsLoggedIn.mockReturnValue(true);
  });

  it("should work for any", async () => {
    mockScanPermissionActionsInAny.mockReturnValueOnce([]);
    await preCheckPermissionsForAny({});
    expect(mockValidatePermissions).not.toBeCalled();
    expect(checkPermissions("my:action-a")).toBe(false);
  });

  it("should clear permission pre-checks", async () => {
    mockValidatePermissions.mockResolvedValueOnce({
      actions: [
        {
          action: "my:action-a",
          authorizationStatus: "authorized",
        },
      ],
    });
    await validatePermissions(["my:action-a"]);
    expect(checkPermissions("my:action-a")).toBe(true);
    resetPermissionPreChecks();
    expect(checkPermissions("my:action-a")).toBe(false);
  });
});
