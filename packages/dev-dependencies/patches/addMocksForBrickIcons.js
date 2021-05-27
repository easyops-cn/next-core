const path = require("path");
const fs = require("fs-extra");

function addMocksForBrickIcons() {
  const mockFilePath = "__mocks__/@next-core/brick-icons.js";
  const dstMockFilePath = path.resolve(mockFilePath);
  if (fs.existsSync(dstMockFilePath)) {
    return;
  }

  fs.outputFileSync(
    dstMockFilePath,
    fs.readFileSync(path.join(__dirname, "../template", mockFilePath), "utf8")
  );
}

module.exports = addMocksForBrickIcons;
