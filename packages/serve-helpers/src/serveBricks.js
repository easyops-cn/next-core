// @ts-check
import path from "node:path";
import { tryServeFiles } from "./tryFiles.js";

/**
 * @typedef {import("express").Request} Request
 * @typedef {import("express").Response} Response
 * @typedef {import("express").NextFunction} NextFunction
 */

/**
 * @param {{ localBrickFolders: string[] }} options
 * @returns {(req: Request, res: Response, next: NextFunction ) => void}
 */
export function serveBricks({ localBrickFolders }) {
  /**
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  return function (req, res, next) {
    const files = localBrickFolders.map((dir) =>
      path.join(dir, req.path.split("/").join(path.sep))
    );
    tryServeFiles(files, req, res, next);
  };
}
