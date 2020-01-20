import path from "path";
import fs from "fs-extra";
import { isNil } from "lodash";
import os from "os";
import chalk from "chalk";

export async function createReleaseRecord(): Promise<void> {
  const appRoot = path.join(process.cwd());

  const dirList = ["atom-bricks", "business-bricks"];

  const demoRoot = path.join(
    appRoot,
    "bricks",
    "developers",
    "src",
    "stories",
    "chapters"
  );
  const docRoot = path.join(appRoot, "bricks", "developers", "src", "docs");

  const currentRecord = fs.readFileSync(`${docRoot}/RELEASE.md`, "utf8");
  let newRecord = "";
  let i = 1;
  dirList.forEach(dirName => {
    const categoryPath = path.join(demoRoot, dirName);
    const firstDirList = fs.readdirSync(categoryPath, "utf8");
    firstDirList.forEach(name => {
      if (name !== "__mocks__" && name !== "index.ts") {
        const dirPath = path.join(categoryPath, name);
        const secondDirList = fs.readdirSync(dirPath, "utf8");
        secondDirList.forEach(fileName => {
          if (fileName !== "index.ts") {
            const files = fs.readFileSync(dirPath + "/" + fileName, "utf8");
            const storyIdReg = /storyId['|"]?\s*:\s*['|"](.*)['|"]/;
            const typeReg = /type['|"]?\s*:\s*['|"](.*)['|"]/;
            const textReg = /text['|"]?\s*:.*?zh:\s*['|"](.*?)['|"]/s;
            const descriptionReg = /description['|"]?\s*:.*?zh:\s*['|"](.*?)['|"]/s;
            const storyIdMatches = files.match(storyIdReg);
            const typeMatches = files.match(typeReg);
            const textMatches = files.match(textReg);
            const descriptionMatches = files.match(descriptionReg);
            if (storyIdMatches && typeMatches && textMatches) {
              const storyId = storyIdMatches[1];
              const type = typeMatches[1];
              const name = textMatches[1];
              const description = descriptionMatches
                ? descriptionMatches[1]
                : "";
              const mdReg = new RegExp(`.*${type}.*${storyId}.*`);
              const matchesRecord = currentRecord.match(mdReg);
              if (isNil(matchesRecord)) {
                const itemUrl = `developers/brick-book/${type}/${storyId}`;
                newRecord += `|[${name}](${itemUrl})|${type}|${storyId}|${description}|${os.EOL}`;
                i++;
              }
            }
          }
        });
      }
    });
  });
  if (newRecord) {
    const recordHeader = `## ${new Date().toISOString().split("T")[0]}${
      os.EOL
    }${os.EOL}| 构件名称 | 构件类型 | 构件 ID | 说明 |${
      os.EOL
    }| -- | -- | -- | -- |${os.EOL}`;
    fs.writeFileSync(
      `${docRoot}/RELEASE.md`,
      `${recordHeader}${newRecord}${os.EOL}共 ${i} 条${os.EOL}${currentRecord}`
    );
    console.log(
      `${chalk.bold("File updated")}: ./${path.relative(
        process.cwd(),
        `${docRoot}/RELEASE.md`
      )}`
    );
  } else {
    console.log("No new release records");
  }
}
