import type { Config } from "jest";

export interface TestNextConfig {
  transformModulePatterns?: string[];
  moduleNameMapper?: Record<string, string>;
  testPathIgnorePatterns?: string[];
  cwd?: string;
  coverageProvider?: Config["coverageProvider"];
}
