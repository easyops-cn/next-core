import cp from "child_process";
import { tmpDir } from "./loaders/env";

const CONTRACT_SCM_URL = "git@git.easyops.local:anyclouds/contract-center.git";

export const clone = () => {
  const result = cp.spawnSync("git", ["clone", "-q", CONTRACT_SCM_URL, tmpDir]);
  return result;
};

export const checkout = (tagOrCommit: string): number => {
  if (tagOrCommit === "") return 0;
  const result = cp.spawnSync("git", ["checkout", tagOrCommit], {
    cwd: tmpDir
  });
  return result.status;
};
