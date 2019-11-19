module.exports = {
  setupFilesAfterEnv: ["<rootDir>/__jest__/setup.ts"],
  snapshotSerializers: [
    "enzyme-to-json/serializer",
    "<rootDir>/__jest__/customElementsV1Serializer.ts"
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "\\.spec\\.[jt]sx?$",
    "/scripts/",
    "/__jest__/",
    "/micro-apps/"
  ],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 50,
      functions: 80,
      lines: 80
    }
  },
  coverageDirectory: "<rootDir>/.coverage",
  coverageReporters: ["lcov", "text-summary"],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest"
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  moduleNameMapper: {
    "\\.module\\.css$": "identity-obj-proxy",
    "\\.less$": "<rootDir>/__mocks__/styleMock.js",
    "\\.css$": "<rootDir>/__mocks__/styleMock.js",
    "^.+\\.html$": "<rootDir>/__mocks__/htmlMock.js",
    "\\.svg": "<rootDir>/__mocks__/svgrMock.js",
    "\\.png": "<rootDir>/__mocks__/pngMock.js",
    "^.+\\.md?$": "<rootDir>/__mocks__/markdownMock.js",
    // Ref http://react-dnd.github.io/react-dnd/docs/testing#setup
    "^dnd-core$": "dnd-core/dist/cjs",
    "^react-dnd$": "react-dnd/dist/cjs",
    "^react-dnd-html5-backend$": "react-dnd-html5-backend/dist/cjs"
  },
  // Ref https://github.com/facebook/jest/issues/2070#issuecomment-431706685
  // Todo(steve): remove next line when issue fixed.
  modulePathIgnorePatterns: ["<rootDir>/.*/__mocks__"],
  // Use jsdom@14 which supports MutationObserver
  testEnvironment: "jest-environment-jsdom-fourteen",
  timers: "fake"
};
