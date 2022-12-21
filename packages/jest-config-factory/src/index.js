import findFileUpward from "./findFileUpward.js";

/**
 * @param {import("@next-core/jest-config-factory").JestConfigFactoryOptions} options
 * @returns {import('jest').Config}
 */
export const jestConfigFactory = ({
  cwd,
  transformModulePatterns = [],
  moduleNameMapper,
  testPathIgnorePatterns = [],
} = {}) => {
  const rootDir = "<rootDir>/../..";
  return {
    roots: ["<rootDir>", rootDir],
    testMatch: ["<rootDir>/**/?(*.)+(spec|test).[jt]s?(x)"],
    resolver: "ts-jest-resolver",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: [`${rootDir}/__jest__/setup.ts`],
    coveragePathIgnorePatterns: [
      "/node_modules/",
      "/dist/",
      "\\.spec\\.[jt]sx?$",
      "/scripts/",
      "/__jest__/",
      "/micro-apps/",
    ],
    collectCoverage: true,
    coverageDirectory: "<rootDir>/.coverage",
    coverageReporters: ["text-summary", "cobertura"],
    transform: {
      "^.+\\.[jt]sx?$": [
        "babel-jest",
        {
          configFile: findFileUpward(cwd || process.cwd(), "babel.config.js"),
        },
      ],
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
      "\\.shadow.css$": `${rootDir}/__mocks__/styleTextMock.js`,
      // "\\.less$": `${rootDir}/__mocks__/styleMock.js`,
      "\\.css$": `${rootDir}/__mocks__/styleMock.js`,
      "\\.html$": `${rootDir}/__mocks__/htmlMock.js`,
      "\\.svg": `${rootDir}/__mocks__/svgrMock.js`,
      "\\.(png|bmp|gif|jpg|jpeg|psd|svg|webp)$": `${rootDir}/__mocks__/fileMock.js`,
      "\\.md?$": `${rootDir}/__mocks__/markdownMock.js`,
      ...moduleNameMapper,
    },
    // Ref https://github.com/facebook/jest/issues/2070#issuecomment-431706685
    // Todo(steve): remove next line when issue fixed.
    modulePathIgnorePatterns: [`${cwd || rootDir}/.*/__mocks__`],
    // Use jsdom >= 14 which supports `MutationObserver`
    // Use jsdom >= 16.2 which supports `CustomElements`
    fakeTimers: {
      enableGlobally: true,
    },
    snapshotFormat: {
      escapeString: true,
      printBasicPrototype: true,
    },
  };
};
