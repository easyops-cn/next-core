const updateMRTemplates = require("./updateMRTemplates");
const fs = require("fs-extra");

jest.spyOn(fs, "outputFileSync").mockImplementation(() => void 0);

describe("updateMRTemplates", () => {
  it("should work", () => {
    updateMRTemplates();
    expect(fs.outputFileSync).toBeCalledWith(
      expect.any(String),
      expect.stringContaining("依赖检查")
    );
  });
});
