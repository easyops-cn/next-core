import chalk from "chalk";
import { main } from "./main";

const len = process.argv.length;
if (len > 3) {
  console.log(chalk.green("run it with `yarn yo-sdk [tagOrCommit]`"));
  process.exit(1);
}

const tagOrCommit = len === 3 ? process.argv[len - 1] : "";
main(tagOrCommit);
