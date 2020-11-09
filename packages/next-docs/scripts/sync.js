const path = require("path");
const fs = require("fs-extra");

const pipesPath = path.dirname(
  require.resolve("@easyops-cn/brick-next-pipes/package.json")
);
const tempPath = path.join(__dirname, "../temp");

fs.copySync(path.join(pipesPath, "api"), tempPath);

fs.copySync(
  path.join(pipesPath, "dist/pipes.json"),
  path.join(__dirname, "../pipes.json")
);
