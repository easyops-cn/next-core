import chalk from "chalk";
import { create } from "./main";

// istanbul ignore next (nothing logic)
create().catch(error => {
  console.error(chalk.red(error.message));
  process.exitCode = 1;
});
