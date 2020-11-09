const path = require("path");
const fs = require("fs-extra");

const tempPath = path.join(__dirname, "../temp");

fs.copySync(
  path.join(
    path.dirname(require.resolve("@easyops-cn/brick-next-pipes/package.json")),
    "api"
  ),
  tempPath
);
