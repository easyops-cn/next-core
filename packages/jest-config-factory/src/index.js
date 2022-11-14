const findFileUpward = require("./findFileUpward");

exports.jestConfigFactory = ({
  transformModulePatterns = [],
  moduleNameMapper,
  standalone,
  testPathIgnorePatterns = [],
  cwd,
} = {}) => {
  const rootDir = `<rootDir>${standalone ? "/../.." : ""}`;
  return {
    ...(standalone
      ? {
          roots: ["<rootDir>", rootDir],
          testMatch: ["<rootDir>/**/?(*.)+(spec|test).[jt]s?(x)"],
        }
      : {
          coverageThreshold: {
            global: {
              statements: 80,
              branches: 50,
              functions: 80,
              lines: 80,
            },
          },
        }),
    testEnvironment: "jsdom",
    setupFilesAfterEnv: [`${rootDir}/__jest__/setup.ts`],
    snapshotSerializers: ["enzyme-to-json/serializer"],
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
      "^.+\\.[jt]sx?$": standalone
        ? [
            "babel-jest",
            {
              configFile: findFileUpward(
                cwd || process.cwd(),
                "babel.config.js"
              ),
            },
          ]
        : "babel-jest",
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
      "\\.less$": `${rootDir}/__mocks__/styleMock.js`,
      "\\.css$": `${rootDir}/__mocks__/styleMock.js`,
      "^.+\\.html$": `${rootDir}/__mocks__/htmlMock.js`,
      "\\.svg": `${rootDir}/__mocks__/svgrMock.js`,
      "\\.png": `${rootDir}/__mocks__/pngMock.js`,
      "^[./a-zA-Z0-9$_-]+\\.(bmp|gif|jpg|jpeg|psd|svg|webp)$": `${rootDir}/__mocks__/fileMock.js`,
      "^.+\\.md?$": `${rootDir}/__mocks__/markdownMock.js`,
      // Ref http://react-dnd.github.io/react-dnd/docs/testing#setup
      "^dnd-core$": "dnd-core/dist/cjs",
      "^react-dnd$": "react-dnd/dist/cjs",
      "^react-dnd-html5-backend$": "react-dnd-html5-backend/dist/cjs",
      // Ref https://github.com/facebook/jest/issues/4262#issuecomment-753147691
      "^@easyops/brick-icons": `${rootDir}/__mocks__/@next-core/brick-icons`,
      "^@easyops/(.*)": "@next-core/$1",
      "^\\./lazy-bricks$": "identity-obj-proxy",
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
