import fs from "fs";
import http from "http";
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
    const onError = (err: Error) => {
      customConsole.error(LogLevel.DEFAULT, chalk.red("Failed to download!"));
      cleanDownload(dest).catch((err) => {
        customConsole.error(LogLevel.VERBOSE, err);
      });
      reject(err);
    };
    followRedirect(
      url,
      options,
      (response) => {
        if (response.statusCode !== 200) {
          onError(new Error(`Download server returns ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on("finish", function () {
          customConsole.log(
            LogLevel.DEFAULT,
            chalk.cyan("Downloaded successfully!")
          );
          resolve();
        });
      },
      onError
    );
  });
}

function followRedirect(
  url: string,
  options: http.RequestOptions,
  callback: (res: http.IncomingMessage) => void,
  onError: (err: Error) => void,
  maxRedirect = 10
): http.ClientRequest {
  return (url.startsWith("https") ? https : http)
    .get(url, options, function (response) {
      if ([301, 302, 303].includes(response.statusCode)) {
        const redirect = response.headers.location;
        maxRedirect--;
        customConsole.log(
          LogLevel.DEFAULT,
          `Downloading template repo redirected to ${redirect} ...`
        );
        followRedirect(redirect, options, callback, onError, maxRedirect);
      } else {
        callback(response);
      }
    })
    .on("error", onError);
}
