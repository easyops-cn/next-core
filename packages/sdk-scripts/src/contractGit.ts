import cp from "child_process";
import { getEasyopsConfig } from "@next-core/repo-config";
import { tmpDir } from "./loaders/env";

const { contractUrl } = getEasyopsConfig();

export const clone = () => {
  const result = cp.spawnSync("git", ["clone", "-q", contractUrl, tmpDir]);
  return result;
};

export const checkout = (tagOrCommit: string): number => {
  if (tagOrCommit === "") return 0;
  const result = cp.spawnSync("git", ["checkout", tagOrCommit], {
    cwd: tmpDir,
  });
  return result.status;
};
