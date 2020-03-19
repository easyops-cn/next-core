const path = require("path");
const fs = require("fs");
const TJS = require("typescript-json-schema");

const schemaDir = path.resolve(__dirname, "../.schema");
if (!fs.existsSync(schemaDir)) {
  fs.mkdirSync(schemaDir);
}

const program = TJS.getProgramFromFiles(
  [path.resolve(__dirname, "../src/manifest.ts")],
  {
    skipLibCheck: true
  }
);

generateSchema("Storyboard", "storyboard.json");
generateSchema("CustomTemplate", "customTemplate.json");

function generateSchema(interfaceName, filename) {
  const schema = TJS.generateSchema(program, interfaceName);

  if (schema === null) {
    process.exitCode = 1;
    throw new Error(`Schema of \`${interfaceName}\` is null`);
  }

  fs.writeFileSync(
    path.resolve(schemaDir, filename),
    JSON.stringify(schema, null, 2)
  );
}
