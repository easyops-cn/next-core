const fs = require("fs");
const { getEasyopsConfig } = require(".");

jest.mock("fs");

describe("getEasyopsConfig", () => {
  it("return default config", () => {
    fs.existsSync.mockReturnValue(false);
    expect(getEasyopsConfig()).toEqual({
      useLocalSdk: false,
      usePublicScope: false,
      contractYamlDir: "easyops",
      contractUrl: "git@git.easyops.local:anyclouds/contract-center.git",
      standalone: false,
      noPostBuildMicroApps: false,
    });
  });

  it("return custom config", () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(
      JSON.stringify({
        useLocalSdk: true,
        usePublicScope: true,
        standalone: true,
        noPostBuildMicroApps: true,
      })
    );
    expect(getEasyopsConfig()).toEqual({
      useLocalSdk: true,
      usePublicScope: true,
      contractYamlDir: "easyops",
      contractUrl: "git@git.easyops.local:anyclouds/contract-center.git",
      standalone: true,
      noPostBuildMicroApps: true,
    });
  });
});
