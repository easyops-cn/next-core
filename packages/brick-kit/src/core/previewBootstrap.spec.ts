import { getPreviewBootstrap } from "./previewBootstrap";
("./previewBootstrap.ts");
import {
  BootstrapStandaloneApi_runtimeStandalone,
  BootstrapV2Api_getBricksInfo,
} from "@next-sdk/api-gateway-sdk";
jest.mock("@next-sdk/api-gateway-sdk");

const mockRuntimeStandalone =
  BootstrapStandaloneApi_runtimeStandalone as jest.Mock;
const mockGetBricksInfo = BootstrapV2Api_getBricksInfo as jest.Mock;
describe("getPreviewBootstrap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should work with no settings", async () => {
    mockRuntimeStandalone.mockResolvedValueOnce({});

    mockGetBricksInfo.mockResolvedValueOnce({
      bricksInfo: [
        {
          dll: ["d3", "react-dnd"],
          filePath: "bricks/graph/dist/index.bda9bcc0.js",
        },
      ],
      templatesInfo: [
        {
          filePath: "templates/general-list/dist/index.b0963230.js",
        },
      ],
    });

    expect(await getPreviewBootstrap()).toEqual({
      microApps: [],
      storyboards: [],
      brickPackages: [
        {
          dll: ["d3", "react-dnd"],
          filePath: "bricks/graph/dist/index.bda9bcc0.js",
        },
      ],
      templatePackages: [
        { filePath: "templates/general-list/dist/index.b0963230.js" },
      ],
    });
  });

  it("should work with settings data", async () => {
    mockRuntimeStandalone.mockResolvedValueOnce({
      settings: {
        featureFlags: {
          "switch-language": true,
        },
        misc: {
          auth_pwd_encrypt_type: "EASYBASE64",
        },
        homepage: "/",
      },
    });

    mockGetBricksInfo.mockResolvedValueOnce({});

    expect(await getPreviewBootstrap()).toEqual({
      brickPackages: [],
      microApps: [],
      settings: {
        featureFlags: { "switch-language": true },
        homepage: "/",
        misc: { auth_pwd_encrypt_type: "EASYBASE64" },
      },
      storyboards: [],
      templatePackages: [],
    });
  });

  it("should console error tips", async () => {
    const mockConsoleWarn = jest.spyOn(console, "warn");
    mockRuntimeStandalone.mockRejectedValueOnce("oops");

    await getPreviewBootstrap();
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      "request runtime api from api-gateway failed: ",
      "oops",
      ", something might went wrong running standalone micro app"
    );
  });
});
