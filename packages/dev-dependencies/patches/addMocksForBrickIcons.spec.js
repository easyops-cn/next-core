const addMocksForBrickIcons = require("./addMocksForBrickIcons");
const fs = require("fs-extra");

const mockExistsSync = jest.spyOn(fs, "existsSync");
const mockOutputFileSync = jest
  .spyOn(fs, "outputFileSync")
  .mockImplementation(() => void 0);

describe("addMocksForBrickIcons", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should work", () => {
    mockExistsSync.mockReturnValueOnce(false);
    addMocksForBrickIcons();
    expect(mockOutputFileSync).toBeCalledWith(
      expect.stringContaining("__mocks__/@next-core/brick-icons.js"),
      expect.stringContaining("export function BrickIcon")
    );
  });

  it("should ignore if mocks existed", () => {
    mockExistsSync.mockReturnValueOnce(true);
    addMocksForBrickIcons();
    expect(mockOutputFileSync).not.toBeCalled();
  });
});
