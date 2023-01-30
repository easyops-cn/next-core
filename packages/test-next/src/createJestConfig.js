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
    collectCoverageFrom: ["**/*.{js,jsx,ts,tsx}"],
    collectCoverage: true,
    coverageDirectory: "<rootDir>/.coverage",
    coverageReporters: ["text-summary", process.env.CI ? "cobertura" : "lcov"],
    transform: {
      "^.+\\.[jt]sx?$": [
        "babel-jest",
        {
          configFile: findFileUpward(cwd, "babel.config.js"),
        },
      ],
      "\\.(png|bmp|gif|jpg|jpeg|webp|html|md|shadow\\.css|svg)$": path.resolve(
        __filename,
        "../transforms/file.js"
      ),
    },
    transformIgnorePatterns: [
      `/node_modules/(?!(?:${[
        "@babel/runtime/helpers/esm/",
        "@(?:next-)?libs/[^/]+/(?:dist/esm/|[^./]+(?:\\.js)?$)",
      ]
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
      // "\\.shadow.css$": `${projectRoot}/__mocks__/styleTextMock.js`,
      // "\\.less$": `${projectRoot}/__mocks__/styleMock.js`,
      // "\\.css$": `${projectRoot}/__mocks__/styleMock.js`,
      // "\\.html$": `${projectRoot}/__mocks__/htmlMock.js`,
      // "\\.svg": `${projectRoot}/__mocks__/svgrMock.js`,
      // "\\.(png|bmp|gif|jpg|jpeg|psd|svg|webp)$": `${projectRoot}/__mocks__/fileMock.js`,
      // "\\.md?$": `${projectRoot}/__mocks__/markdownMock.js`,
      ...moduleNameMapper,
    },
    // Ref https://github.com/facebook/jest/issues/2070#issuecomment-431706685
    // Todo(steve): remove next line when issue fixed.
    modulePathIgnorePatterns: ["<rootDir>/.*/__mocks__"],
    // fakeTimers: {
    //   enableGlobally: true,
    // },
    // snapshotFormat: {
    //   escapeString: true,
    //   printBasicPrototype: true,
    // },
    resetMocks: true,
  };
}
