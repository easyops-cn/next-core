const fs = require("fs");
const path = require("path");
const prettier = require("prettier");
const { createTwoFilesPatch } = require("diff");

const expectedPath = "./manifest.snapshot.json";
const receivedPath = "./dist/manifest.json";
const expected = prettierJson(expectedPath);
const received = prettierJson(receivedPath);

if (expected === received) {
  console.log("✔️ Manifest snapshot matched!");
} else {
  console.error("⚠️ Manifest snapshot not match!");
  const patch = createTwoFilesPatch(
    expectedPath,
    receivedPath,
    expected,
    received,
    "(expected)",
    "(received)",
    { context: 3 }
  );
  console.log(patch);
  process.exitCode = 1;
}

function prettierJson(filePath) {
  return prettier.format(fs.readFileSync(path.resolve(filePath), "utf8"), {
    parser: "json",
  });
}
