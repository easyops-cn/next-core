import { existsSync } from "node:fs";

/**
 * @param files {string|string[]}
 */
export function tryFiles(files) {
  /** @type {string[]} */
  const fileList = [].concat(files);
  for (const filePath of fileList) {
    if (existsSync(filePath)) {
      return filePath;
    }
  }
}

/**
 * @param files {string|string[]}
 * @param req {import("express").Request}
 * @param res {import("express").Response}
 */
export function tryServeFiles(files, req, res, next) {
  const filePath = tryFiles(files);
  if (filePath) {
    res.sendFile(filePath);
    return;
  }
  next();
}
