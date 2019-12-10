const path = require("path");

// These directories below are served as static files by nginx,
// which cannot be used as a micro-app's homepage.
const reservedDirectories = [
  "bricks",
  "micro-apps",
  "templates",
  "api",
  "assets"
];

module.exports = function ensureMicroApp() {
  const dirname = path.basename(process.cwd());
  const storyboard = require(path.join(process.cwd(), "storyboard.json"));
  if (storyboard && storyboard.app) {
    if (storyboard.app.id !== dirname) {
      throw new Error(
        `\`app.id\` should always be the same as its directory name: '${dirname}' => '${storyboard.app.id}'`
      );
    }
    if (storyboard.app.homepage) {
      const homepageDir = storyboard.app.homepage
        .replace(/^\//, "")
        .split("/")[0];
      if (reservedDirectories.includes(homepageDir)) {
        throw new Error(
          `\`${homepageDir}\` is a reserved directory, which cannot be used as a micro-app's homepage`
        );
      }
    }
  }
};
