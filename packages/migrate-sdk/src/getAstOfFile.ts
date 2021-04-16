import chalk from "chalk";
import { parse, ParserPlugin } from "@babel/parser";
import * as t from "@babel/types";

const babelPluginsDefault: ParserPlugin[] = [
  ["decorators", { decoratorsBeforeExport: true }],
  "classProperties",
  "typescript",
];

const babelPluginsWithJsx = babelPluginsDefault.concat("jsx");

export function getAstOfFile(source: string, filePath: string): t.File {
  try {
    return parse(source, {
      plugins: filePath.endsWith(".tsx")
        ? babelPluginsWithJsx
        : babelPluginsDefault,
      sourceType: "module",
    });
  } catch (e) {
    console.error(chalk.red(`Failed to parse '${filePath}'`));
    throw e;
  }
}
