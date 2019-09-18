const path = require("path");

module.exports = function ensureMicroApp() {
  const dirname = path.basename(process.cwd());
  const storyboard = require(path.join(process.cwd(), "storyboard.json"));
  if (storyboard && storyboard.app) {
    if (storyboard.app.id !== dirname) {
      throw new Error(
        `\`app.id\` should always be the same as its directory name: '${dirname}' => '${storyboard.app.id}'`
      );
    }
  }
};
