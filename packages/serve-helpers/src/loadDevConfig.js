import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * @param {string} rootDir
 * @returns {Promise<unknown | undefined>}
 */
export async function loadDevConfig(rootDir) {
  const configPath = path.join(rootDir, "dev.config.mjs");
  if (existsSync(configPath)) {
    return (await import(pathToFileURL(configPath).href)).default;
  }
}
