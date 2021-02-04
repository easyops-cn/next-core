import fs from "fs";
import StreamZip from "node-stream-zip";
import chalk from "chalk";
import { customConsole, LogLevel } from "./customConsole";

export function extract(src: string, dest: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    customConsole.log(LogLevel.DEFAULT, `Extracting template repo ...`);
    const zip = new StreamZip({
      file: src,
      storeEntries: true,
    });
    zip.on("ready", () => {
      const rootEntry = Object.keys(zip.entries())[0];
      fs.mkdirSync(dest);
      zip.extract(rootEntry, dest, (err) => {
        zip.close();
        if (err) {
          customConsole.log(LogLevel.DEFAULT, chalk.red(`Failed to extract!`));
          reject(err);
        } else {
          customConsole.log(
            LogLevel.DEFAULT,
            chalk.cyan(`Extracted successfully!`)
          );
          resolve();
        }
      });
    });
  });
}
