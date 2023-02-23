import chalk from "chalk";
import meow from "meow";
import { main } from "./main.js";

const cli = meow(
  `
 Usage
  $ yarn yo-sdk <input>
 Options
  --sdk, -s
`,
  {
    flags: {
      sdk: {
        type: "string",
        alias: "s",
      },
    },
  }
);

if (cli.input.length > 1) {
  console.error(chalk.red("Run it with `yarn yo-sdk [tagOrCommit]`"));
  process.exit(2);
}
const tagOrCommit = cli.input[0];
main(tagOrCommit, cli.flags);
