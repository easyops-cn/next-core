const fs = require("fs-extra");
const path = require("path")

module.exports = {
  easyopsConfig: fs.readJsonSync(path.join(process.cwd(), ".easyops-yo.json")),
  isEasyopsConfigExists: fs.existsSync(path.join(process.cwd(), ".easyops-yo.json"))
}
