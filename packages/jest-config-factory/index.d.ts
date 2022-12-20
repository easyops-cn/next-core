import type { Config } from "jest";

/**
 * Usage:
 *
 * ```js
 * import { dirname } from 'node:path';
 * import { fileURLToPath } from 'node:url';
 * import { jestConfigFactory } from "@next-core/jest-config-factory";
 *
 * const __dirname = dirname(fileURLToPath(import.meta.url));
 *
 * export default jestConfigFactory({
 *   cwd: __dirname,
 * });
 * ```
 */
export declare function jestConfigFactory(
  options?: JestConfigFactoryOptions
): Config;

export interface JestConfigFactoryOptions {
  cwd?: string;
  transformModulePatterns?: string[];
  moduleNameMapper?: Record<string, string>;
  testPathIgnorePatterns?: string[];
}
