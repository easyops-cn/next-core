const path = require("path");
const fs = require("fs");
const meow = require("meow");
const prettier = require("prettier");

module.exports = function buildMicroApps() {
  const dirname = process.cwd();
  const indexJsPath = path.join(dirname, "dist/index.js");
  const storyboardJsonPath = path.join(dirname, "storyboard.json");

  function requireUncached(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
  }

  function writeStoryboard(json) {
    const content = JSON.stringify(json, null, 2);
    fs.writeFileSync(
      storyboardJsonPath,
      prettier.format(content, {
        parser: "json"
      })
    );
    console.log("File Updated: ./storyboard.json");
  }

  const { flags } = meow({
    flags: {
      watch: {
        type: "boolean",
        alias: "w"
      }
    }
  });

  if (fs.existsSync(indexJsPath)) {
    const storyboard = require(indexJsPath).default;
    writeStoryboard(storyboard);
  } else if (!flags.watch) {
    console.error("File not found:", indexJsPath);
  }

  if (flags.watch) {
    console.log("Watching...");
    fs.watchFile(indexJsPath, current => {
      if (current.size !== 0) {
        const storyboard = requireUncached(indexJsPath).default;
        writeStoryboard(storyboard);
      }
    });
  }
};
