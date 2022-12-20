export interface TestNextConfig {
  transformModulePatterns?: string[];
  moduleNameMapper?: Record<string, string>;
  testPathIgnorePatterns?: string[];
  cwd?: string;
}
