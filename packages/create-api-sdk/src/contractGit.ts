import { spawn } from "node:child_process";
import { getEasyopsConfig } from "@next-core/repo-config";
import { tmpDir } from "./loaders/env.js";

const { contractUrl } = getEasyopsConfig();

export const clone = (): Promise<void> => {
  const result = spawn("git", ["clone", contractUrl, tmpDir], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });

  return new Promise<void>((resolve, reject) => {
    result.on("close", (code) => {
      if (code !== 0) {
        reject(code);
      } else {
        resolve(null);
      }
    });
  });
};

export const checkout = (tagOrCommit: string): Promise<void> => {
  if (tagOrCommit === "") return Promise.resolve();

  const result = spawn("git", ["checkout", tagOrCommit], {
    cwd: tmpDir,
    stdio: "inherit",
    env: process.env,
  });

  return new Promise<void>((resolve, reject) => {
    result.on("close", (code) => {
      if (code !== 0) {
        reject(code);
      } else {
        resolve(null);
      }
    });
  });
};
