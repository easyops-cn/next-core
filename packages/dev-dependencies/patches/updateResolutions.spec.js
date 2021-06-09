const fs = require("fs-extra");
const updateResolutions = require("./updateResolutions");

jest.mock("fs-extra");

const mockFsReadJsonSync = jest.spyOn(fs, "readJsonSync");
const mockFsWriteJsonSync = jest.spyOn(fs, "writeJsonSync");

describe("updateResolutions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should init and set resolutions", () => {
    mockFsReadJsonSync.mockReturnValueOnce({
      name: "any",
    });
    updateResolutions();
    expect(mockFsWriteJsonSync).toBeCalledWith(
      expect.stringContaining("package.json"),
      {
        name: "any",
        resolutions: {
          "@testing-library/dom": "^7.31.2",
        },
      }
    );
  });

  it("should add resolutions", () => {
    mockFsReadJsonSync.mockReturnValueOnce({
      name: "any",
      resolutions: {
        lodash: "^4.17.21",
      },
    });
    updateResolutions();
    expect(mockFsWriteJsonSync).toBeCalledWith(
      expect.stringContaining("package.json"),
      {
        name: "any",
        resolutions: {
          lodash: "^4.17.21",
          "@testing-library/dom": "^7.31.2",
        },
      }
    );
  });

  it("should ignore if resolutions exists", () => {
    mockFsReadJsonSync.mockReturnValueOnce({
      name: "any",
      resolutions: {
        "@testing-library/dom": "^7.31.2",
      },
    });
    updateResolutions();
    expect(mockFsWriteJsonSync).not.toBeCalled();
  });
});
