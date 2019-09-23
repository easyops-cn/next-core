const path = require("path");
const fs = require("fs");
const TJS = require("typescript-json-schema");

const program = TJS.getProgramFromFiles(
  [path.resolve(__dirname, "../src/manifest.ts")],
  {
    skipLibCheck: true
  }
);
const schema = TJS.generateSchema(program, "Storyboard");

const schemaDir = path.resolve(__dirname, "../.schema");
if (!fs.existsSync(schemaDir)) {
  fs.mkdirSync(schemaDir);
}

fs.writeFileSync(
  path.resolve(schemaDir, "storyboard.json"),
  JSON.stringify(schema, null, 2)
);
