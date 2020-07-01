import path from "path";
import fs from "fs-extra";
import os from "os";
import chalk from "chalk";
import { escapeRegExp } from "lodash";

const propertyDefinitionReg = (propertyName: string) => {
  return new RegExp(
    "\\|\\s*[\"']?" +
      escapeRegExp(propertyName) +
      "((\\s*[\"']?(?<!\\\\)\\|(((?<=\\\\)\\|)|[^|])*){4}\\|)"
  );
};

const commentReg = (text: string) => {
  return new RegExp(
    "(?<=(\\/\\*\\*(.|@|\\s)*?\\*\\/\\s*))" + escapeRegExp(text)
  );
};

const matchEventDecorate = (eventType: string, fileText: string) => {
  const reg = new RegExp(
    "(?<=(\\/\\*\\*(.|@|\\s)*?\\*\\/\\s*))" +
      "@event\\(.*?(type:\\s*(\"|')" +
      escapeRegExp(eventType) +
      "(\"|')).*?\\)"
  );
  return fileText.match(reg);
};

const matchMethodDecorate = (methodName: string, fileText: string) => {
  const reg = new RegExp(
    "(?<=(\\/\\*\\*(.|@|\\s)*?\\*\\/\\s*))" +
      "@method\\([^)]*?\\)\\s*" +
      escapeRegExp(methodName)
  );
  return fileText.match(reg);
};

const getComment = (text: string, fileText) => {
  const testCommentReg = commentReg(text);
  const commentExistMatch = fileText.match(testCommentReg);
  return commentExistMatch?.[1];
};

const updateComments = (matchText: string, fileText, newCommentText) => {
  const testCommentReg = commentReg(matchText);
  const commentExistMatch = fileText.match(testCommentReg);
  let newFileText = fileText;
  if (!commentExistMatch?.[1]) {
    const matchIndex = newFileText.indexOf(matchText);
    newFileText =
      newFileText.slice(0, matchIndex) +
      newCommentText +
      newFileText.slice(matchIndex);
  }
  return newFileText;
};

export async function generateDoc(bricks): Promise<void> {
  const appRoot = path.join(process.cwd());
  const list = bricks?.split(",");
  if (list?.length) {
    list.forEach((b) => {
      const splitBrick = b.split(".");
      const packageName = splitBrick[0];
      const brickRoot = path.join(appRoot, "bricks", packageName, "src");
      const docRoot = path.join(
        appRoot,
        "bricks",
        "developers",
        "src",
        "stories",
        "docs",
        packageName
      );
      const ifWholePackages = !splitBrick[1];
      let brickName = "";
      if (!ifWholePackages) {
        brickName = splitBrick[1];
      }
      const bricksList = fs.readdirSync(brickRoot, "utf8");
      bricksList.forEach((name) => {
        if (ifWholePackages || name === brickName) {
          brickName = name;
          const errorPropertiesList = [];
          const methodList = [];
          const eventList = [];
          const indexPath = path.join(brickRoot, brickName, "index.tsx");
          try {
            const indexFile = fs.readFileSync(indexPath, "utf8");
            let newIndexFileText = indexFile;
            const docPath = path.join(docRoot, `${brickName}.md`);

            const doc = fs.readFileSync(docPath, "utf8");

            // 获得对应的 story
            let description = "";
            let author = "";
            const storyPathReg = /\[\/\/]: # "(.*)"/;
            const storyPathMatches = doc.match(storyPathReg);
            if (storyPathMatches) {
              const storyPath = path.join(
                appRoot,
                "bricks",
                "developers",
                "src",
                "stories",
                "chapters",
                storyPathMatches[1]
              );
              const storyFile = fs.readFileSync(storyPath, "utf8");
              const descriptionReg = /description['|"]?\s*:.*?zh:\s*['|"](.*?)['|"]/s;
              const authorReg = /author['|"]?\s*:\s*['|"](.*)['|"]/;
              const descriptionMatches = storyFile.match(descriptionReg);
              const authorMatches = storyFile.match(authorReg);
              description = descriptionMatches?.[1] ?? "";
              author = authorMatches?.[1] ?? "";
            }

            // 获得 slots
            const slots = [];
            const slotsReg = /# (?:slots|SLOTS)\s*.*\s*\|(?:-*\s*\|\s*){3}((.|((?<!\n)\s))*)/;
            const slotsMatches = doc.match(slotsReg);
            if (slotsMatches) {
              const slotContent = slotsMatches[1];
              const slotContentReg = /\|.*\|.*\|/g;
              const slotContentMatches = slotContent.matchAll(slotContentReg);
              if (slotContentMatches) {
                for (const match of slotContentMatches) {
                  const s = match[0].split("|").map((v) => v?.trim());
                  if ((s[1] || s[2]) && (s[1] !== "-" || s[2] !== "-")) {
                    slots.push(s[1] + ":" + s[2]);
                  }
                }
              }
            }

            const methodsReg = /# (?:METHODS)\s*.*\s*\|(?:-*\s*\|\s*){4}((.|((?<!\n)\s))*)/;
            const methodsMatches = doc.match(methodsReg);
            if (methodsMatches) {
              const methodsContent = methodsMatches[1];
              const methodsContentReg = /\|.*\|.*\|.*\|/g;
              const methodsContentMatches = methodsContent.matchAll(
                methodsContentReg
              );
              if (methodsContentMatches) {
                for (const match of methodsContentMatches) {
                  const s = match[0].split("|").map((v) => v?.trim());
                  if (s[1] && s[1] !== "-") {
                    const methodMatch = matchMethodDecorate(
                      s[1],
                      newIndexFileText
                    );
                    if (!methodMatch) {
                      methodList.push({
                        name: s[1],
                        description: s[3],
                      });
                    }
                  }
                }
              }
            }

            // 获得 events
            const eventsReg = /# (?:EVENTS)\s*.*\s*\|(?:-*\s*\|\s*){4}((.|((?<!\n)\s))*)/;
            const eventsMatches = doc.match(eventsReg);
            if (eventsMatches) {
              const eventsContent = eventsMatches[1];
              const eventsContentReg = /\|.*\|.*\|.*\|/g;
              const eventsContentMatches = eventsContent.matchAll(
                eventsContentReg
              );
              if (eventsContentMatches) {
                for (const match of eventsContentMatches) {
                  const s = match[0].split("|").map((v) => v?.trim());
                  if (s[1] && s[1] !== "-") {
                    const eventMatch = matchEventDecorate(
                      s[1],
                      newIndexFileText
                    );
                    if (!eventMatch) {
                      eventList.push({
                        name: s[1],
                        description: s[3],
                      });
                    }
                  }
                }
              }
            }

            // 获得 history
            const history = [];
            const historyReg = /<details>\s*<summary>History<\/summary>\s*.*\s*\|(?:-*\s*\|\s*){3}((.|((?<!\n)\s))*)\s*<\/details>/;
            const historyMatches = doc.match(historyReg);
            if (historyMatches) {
              const historyContent = historyMatches[1];
              const historyContentReg = /\|.*\|.*\|/g;
              const historyContentMatches = historyContent.matchAll(
                historyContentReg
              );
              if (historyContentMatches) {
                for (const match of historyContentMatches) {
                  const h = match[0].split("|").map((v) => v?.trim());
                  if ((h[1] || h[2]) && (h[1] !== "-" || h[2] !== "-")) {
                    history.push(h[1] + ":" + h[2]);
                  }
                }
              }
            }

            // 处理 Basic Information
            const elementDefinedReg = /(export )?class[\w\s]*\{/;
            const matchClassMatch = indexFile.match(elementDefinedReg);
            const docTextOfBasicInformation = `/**${os.EOL}* @id ${
              packageName + "." + brickName
            }${os.EOL}* @name ${packageName + "." + brickName}${
              os.EOL
            }* @docKind brick${os.EOL}* @description ${description}${
              os.EOL
            }* @author ${author}${os.EOL}* @slots ${
              slots.length ? `${os.EOL}* ` + slots.join(`${os.EOL}* `) : ""
            }${os.EOL}* @history ${
              history.length ? `${os.EOL}* ` + history.join(`${os.EOL}* `) : ""
            }${os.EOL}* @memo ${os.EOL}* @noInheritDoc ${os.EOL}*/${os.EOL}${
              matchClassMatch[1] ? "" : "export "
            }`;
            newIndexFileText = updateComments(
              matchClassMatch[0],
              newIndexFileText,
              docTextOfBasicInformation
            );

            // 处理 properties
            const propertiesMap = new Map();
            // @property 声明的属性
            const propertyReg = /(@property\([^)]*\)\s*)(\w*)/g;
            // set 声明的属性
            const setPropertyReg = /set (\w*)\s*\(/g;
            const propertyMatches = indexFile.matchAll(propertyReg);

            const setPropertyRegMatches = indexFile.matchAll(setPropertyReg);
            const inputsReg = /# (?:INPUTS)\s*.*\s*\|(?:-*\s*\|\s*){6}((.|((?<!\n)\s))*)/;
            const inputsMatches = doc.match(inputsReg);
            const inputsContent = inputsMatches?.[1];
            const propertiesList = [];
            if (inputsContent) {
              for (const match of setPropertyRegMatches) {
                const matchText = match[0];
                const propertyName = match[1];
                propertiesList.push({ matchText, propertyName });
              }
              for (const match of propertyMatches) {
                const matchText = match[0];
                const propertyName = match[2];
                propertiesList.push({ matchText, propertyName });
              }
              for (const property of propertiesList) {
                const matchText = property.matchText;
                const propertyName = property.propertyName;
                const findPropertyDefinition = inputsContent.match(
                  propertyDefinitionReg(propertyName)
                );
                const findComment = getComment(matchText, newIndexFileText);
                if (!findPropertyDefinition && !findComment) {
                  errorPropertiesList.push(propertyName);
                } else if (findPropertyDefinition) {
                  const splitDefinition = findPropertyDefinition[0]
                    .split(/(?<!\\)\|/)
                    .slice(1, -1)
                    .map((v) => v.trim());
                  const propertyInfo = {
                    name: splitDefinition[0],
                    kind: splitDefinition[1],
                    required:
                      splitDefinition[2] == "✔️"
                        ? true
                        : splitDefinition[2] == "-"
                        ? false
                        : splitDefinition[2],
                    default: splitDefinition[3],
                    description: splitDefinition[4],
                  };
                  const docTextOfProperty = `/**${os.EOL}\t* @kind ${propertyInfo.kind}${os.EOL}\t* @required ${propertyInfo.required}${os.EOL}\t* @default ${propertyInfo.default}${os.EOL}\t* @description ${propertyInfo.description}${os.EOL}\t*/${os.EOL}\t`;
                  newIndexFileText = updateComments(
                    matchText,
                    newIndexFileText,
                    docTextOfProperty
                  );

                  propertiesMap.set(propertyName, {
                    propertyInfo,
                    docTextOfProperty,
                  });
                }
              }
            }

            fs.writeFileSync(
              path.join(brickRoot, brickName, "index.tsx"),
              newIndexFileText
            );
            console.log(
              `${chalk.bold("File updated")}: ./${path.relative(
                process.cwd(),
                `${path.join(brickRoot, brickName, "index.tsx")}`
              )}`
            );
            if (errorPropertiesList.length) {
              // 提示欠缺属性
              console.log(
                `${chalk.bold.red(
                  `请给构件<${packageName}.${brickName}>添加以下属性的注释:${os.EOL}`
                )}${errorPropertiesList.join(",")}`
              );
            }
            if (methodList.length) {
              // 仅提示大家需要手动补充
              console.log(
                `${chalk.bold.red(
                  `请给构件<${packageName}.${brickName}>添加以下 methods 的注释:${os.EOL}`
                )}${methodList
                  .map((v) => v.name + ":" + v.description)
                  .join("\n")}`
              );
            }
            if (eventList.length) {
              // 仅提示大家需要手动补充
              console.log(
                `${chalk.bold.red(
                  `请给构件<${packageName}.${brickName}>添加以下 events 的注释:${os.EOL}`
                )}${eventList
                  .map((v) => v.name + ":" + v.description)
                  .join("\n")}`
              );
            }
          } catch (e) {
            // do nothing
          }
        }
      });
    });
  } else {
    console.log(
      `${chalk.bold.yellow(
        "请按照如下格式添加-b参数声明需要生成文档的构件"
      )}: ${os.EOL}${chalk.bold.blue(
        "单个构件"
      )}:yarn yo-doc -b presentational-bricks.brick-tag${
        os.EOL
      }${chalk.bold.blue(
        "多个构件"
      )}:yarn yo-doc -b presentational-bricks.brick-tag,code-bricks.code-display${
        os.EOL
      }${chalk.bold.blue("整个构件包")}:yarn yo-doc -b presentational-bricks${
        os.EOL
      }${chalk.bold.blue(
        "多个构件包"
      )}:yarn yo-doc -b presentational-bricks,code-bricks${os.EOL}`
    );
  }
}
