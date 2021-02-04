import chalk from "chalk";
import { getOptions } from "./getOptions";
import { download } from "./download";
import { extract } from "./extract";
import { patch } from "./patches";
import { cleanDownload } from "./cleanDownload";
import { customConsole, LogLevel, setLogLevel } from "./customConsole";

async function main() {
  const {
    internal,
    repoDir,
    templateRepoZipUrl,
    zipFilePath,
    verbose,
  } = getOptions();

  if (verbose) {
    setLogLevel(LogLevel.VERBOSE);
  }

  await download(templateRepoZipUrl, zipFilePath);
  await extract(zipFilePath, repoDir);
  await patch(repoDir, { internal });
  await cleanDownload(zipFilePath);

  customConsole.log(LogLevel.DEFAULT, chalk.green("No worries!"));
}

main().catch((error) => {
  customConsole.error(LogLevel.DEFAULT, chalk.red(error.message));
  customConsole.error(LogLevel.VERBOSE, error);
  process.exitCode = 1;
});
