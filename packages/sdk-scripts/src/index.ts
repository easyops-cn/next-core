import chalk from "chalk";
import { main } from "./main";
import meow from "meow";
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
  console.log(chalk.green("run it with `yarn yo-sdk [tagOrCommit]`"));
  process.exit(1);
}
const tagOrCommit = cli.input[0];
main(tagOrCommit, cli.flags);
