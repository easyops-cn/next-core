import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import klawSync from "klaw-sync";
import { translateListToAutocomplete } from "./translateListToAutocomplete";

export function askEditorBrickName({
  packageName,
  appRoot,
}: {
  packageName: string;
  appRoot: string;
}): inquirer.DistinctQuestion<{ brickName: string }> {
  const pkgDir = path.join(appRoot, "bricks", packageName);
  const bricksJsonPath = path.join(pkgDir, "dist/bricks.json");
  let bricks: string[] = [];
  if (fs.existsSync(bricksJsonPath)) {
    const bricksJson = JSON.parse(fs.readFileSync(bricksJsonPath, "utf-8"));
    bricks = bricksJson.bricks;
  } else {
    const tsFiles = klawSync(path.join(pkgDir, "src"), {
      depthLimit: 4,
      nodir: true,
      filter: (item) =>
        /\.tsx?$/.test(item.path) && !/\.spec\.tsx?$/.test(item.path),
    });
    for (const file of tsFiles) {
      const content = fs.readFileSync(file.path, "utf-8");
      const matches = content.matchAll(
        /\bcustomElements\.define\(\s*['"]([-a-z0-9.]+)['"]/g
      );
      for (const match of matches) {
        bricks.push(match[1]);
      }
    }
  }

  const brickNameList = bricks
    .map((brick) => brick.split(".").slice(1).join("."))
    .filter((lastName) => /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(lastName))
    .sort();

  if (brickNameList.length === 0) {
    throw new Error("No bricks found, please create a brick first.");
  }

  return translateListToAutocomplete({
    type: "list",
    name: "brickName",
    message: `which editor of brick do you want to create?`,
    choices: brickNameList,
  });
}
