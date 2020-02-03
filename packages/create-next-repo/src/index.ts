import chalk from "chalk";
import { main } from "./main";

// istanbul ignore next (nothing logic)
main().catch(error => {
  console.error(chalk.red(error.message));
  process.exitCode = 1;
});
