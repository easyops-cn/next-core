import fs from "fs";
import https from "https";
import chalk from "chalk";
import createHttpsProxyAgent from "https-proxy-agent";
import { customConsole, LogLevel } from "./customConsole";
import { cleanDownload } from "./cleanDownload";

export function download(url: string, dest: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const options: https.RequestOptions = {
      // Timeout in 60 seconds.
      timeout: 6e4,
    };
    const proxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
    if (proxy) {
      customConsole.log(
        LogLevel.VERBOSE,
        chalk.gray(`Will download using proxy: ${proxy}`)
      );
      options.agent = createHttpsProxyAgent(proxy);
    }
    const file = fs.createWriteStream(dest);
    customConsole.log(
      LogLevel.DEFAULT,
      `Downloading template repo from ${url} ...`
    );
    https
      .get(url, options, function (response) {
        response.pipe(file);
        file.on("finish", function () {
          customConsole.log(
            LogLevel.DEFAULT,
            chalk.cyan("Downloaded successfully!")
          );
          resolve();
        });
      })
      .on("error", function (err) {
        customConsole.error(LogLevel.DEFAULT, chalk.red("Failed to download!"));
        cleanDownload(dest).catch((err) => {
          customConsole.error(LogLevel.VERBOSE, err);
        });
        reject(err);
      });
  });
}
