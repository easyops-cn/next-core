// File System, hard to test for now.
/* istanbul ignore file */
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

interface YoHistory {
  lastSelectedBrickPackage?: string;
  lastSelectedTemplatePackage?: string;
}

const historyLogFilename = ".yo.log";
let history: YoHistory;
let historyLoaded = false;

export function loadHistory(): YoHistory {
  if (!historyLoaded) {
    const filePath = path.resolve(historyLogFilename);
    if (fs.existsSync(filePath)) {
      try {
        history = JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch {
        console.error(chalk.red(`JSON.parse() failed: ${filePath}`));
      }
    }
    historyLoaded = true;
  }
  return history || {};
}

export function updateHistory(partialHistory: Partial<YoHistory>): void {
  const previousHistory = loadHistory();
  history = Object.assign(previousHistory, partialHistory);
  fs.outputFileSync(
    path.resolve(historyLogFilename),
    JSON.stringify(history, null, 2)
  );
}
