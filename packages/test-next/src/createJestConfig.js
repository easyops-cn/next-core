// @ts-check
import path from "node:path";
import { fileURLToPath } from "node:url";
import findFileUpward from "./findFileUpward.js";

const __filename = fileURLToPath(import.meta.url);

/**
 * @param {import("@next-core/test-next").TestNextConfig & { cwd: string }} options
 * @returns {import('jest').Config}
 */
export function createJestConfig({
  cwd,
  transformModulePatterns = [],
  moduleNameMapper,
  testPathIgnorePatterns = [],
  coverageProvider,
}) {
  const projectRoot = "<rootDir>/../..";
  return {
    // Mocking for node modules must live in one of `roots`.
    // While jest also locates test and source files there.
    roots: ["<rootDir>/src/", `${projectRoot}/jest`],
    testMatch: ["<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}"],
    resolver: "ts-jest-resolver",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: [`${projectRoot}/__jest__/setup.ts`],
    coverageProvider,
    collectCoverageFrom: ["**/*.{js,jsx,ts,tsx}"],
    collectCoverage: true,
    coverageDirectory: "<rootDir>/.coverage",
    coveragePathIgnorePatterns: ["/__(?:fixtures|mocks)__/"],
    coverageReporters: ["text-summary", process.env.CI ? "cobertura" : "lcov"],
    transform: {
      "^.+\\.[jt]sx?$": [
        "babel-jest",
        {
          configFile: findFileUpward(cwd, "babel.config.js"),
        },
      ],
      "\\.(png|bmp|gif|jpg|jpeg|webp|html|md|(?<!module\\.)css|svg)$":
        path.resolve(__filename, "../transforms/file.js"),
    },
    transformIgnorePatterns: [
      `/node_modules/(?!(?:${["@babel/runtime/helpers/esm/"]
        .concat(transformModulePatterns)
        .join("|")}))`,
    ],
    testPathIgnorePatterns: [
      "/node_modules/",
      "/dist/",
      ...testPathIgnorePatterns,
    ],
    moduleNameMapper: {
      "\\.module\\.css$": "identity-obj-proxy",
      // Currently we can't use a transformer for imports with resource query.
      // See https://github.com/jestjs/jest/pull/4549
      "(.*)\\.svg\\?url$": `${projectRoot}/jest/__mocks__/svg-url.js`,
      ...moduleNameMapper,
    },
    // Ref https://github.com/facebook/jest/issues/2070#issuecomment-431706685
    // Todo(steve): remove next line when issue fixed.
    modulePathIgnorePatterns: ["<rootDir>/.*/__mocks__"],
    clearMocks: true,
    // https://github.com/jestjs/jest/issues/14305
    prettierPath: null,
  };
}
