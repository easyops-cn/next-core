import cp from "child_process";
import path from "path"
import fs from "fs-extra"

import { tmpDir } from "./loaders/env";
const easyopsConfig = fs.existsSync(path.join(process.cwd(), ".easyops-yo.json")) && fs.readJsonSync(path.join(process.cwd(), ".easyops-yo.json"))
const CONTRACT_SCM_URL = "git@git.easyops.local:anyclouds/contract-center.git";
export const clone = () => {
  const result = cp.spawnSync("git", [
    "clone",
    "-q",
    (easyopsConfig.contractUrl  as string) || CONTRACT_SCM_URL,
    tmpDir,
  ]);
  return result;
};

export const checkout = (tagOrCommit: string): number => {
  if (tagOrCommit === "") return 0;
  const result = cp.spawnSync("git", ["checkout", tagOrCommit], {
    cwd: tmpDir,
  });
  return result.status;
};
