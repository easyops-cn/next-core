import { RequestHandler } from "express";

export interface DevConfig {
  /**
   * 设置用于查找本地构件包的文件夹。
   *
   * @default ["node_modules/@next-bricks","node_modules/@bricks"]
   *
   * @example
   *
   * ```js
   * export default {
   *   brickFolders: [
   *     "node_modules/@next-bricks",
   *     "node_modules/@bricks",
   *     "../next-*\/bricks",
   *   ]
   * }
   * ```
   */
  brickFolders?: string[];

  /**
   * 服务端设置（特性开关和杂项配置等）
   *
   * @example
   * ```js
   * export default {
   *   settings: {
   *     featureFlags: {
   *       "my-flag": true,
   *     }
   *     misc: {
   *       "myMisc": "anything",
   *     },
   *   },
   * }
   * ```
   */
  settings?: Settings;

  /**
   * 微应用配置
   *
   * @example
   * ```js
   * export default {
   *   userConfigByApps: {
   *     "my-app-id": {
   *       myAnyAppConfig: "anything",
   *     },
   *   },
   * }
   * ```
   */
  userConfigByApps?: UserConfigByApps;

  /**
   * API mocks
   *
   * @example
   * ```js
   * export default {
   *   mocks: [
   *     (req, res, next) => {
   *       switch (`${req.method} ${req.path}`) {
   *         case "GET /api/my-any-api":
   *           res.send("fake response");
   *           return;
   *         case "GET /api/my-another-api":
   *           res.send("another fake response");
   *           return;
   *       }
   *       next();
   *     }
   *   ]
   * }
   * ```
   */
  mocks?: RequestHandler[];
}

interface Settings {
  /** 特性开关 */
  featureFlags?: Record<string, boolean>;
  /** 杂项配置 */
  misc?: Record<string, unknown>;
  [k: string]: unknown;
}

type UserConfigByApps = Record<string, Record<string, unknown>>;
