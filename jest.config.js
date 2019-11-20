module.exports = {
  setupFilesAfterEnv: ["<rootDir>/__jest__/setup.ts"],
  snapshotSerializers: ["enzyme-to-json/serializer"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "\\.spec\\.[jt]sx?$",
    "/packages/.*-config-factory/",
    "/scripts/",
    "/__jest__/"
  ],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      statements: 91.5,
      branches: 85.04,
      functions: 95.21,
      lines: 91.41
    }
  },
  coverageDirectory: "<rootDir>/.coverage",
  coverageReporters: ["lcov", "text-summary"],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest"
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/template/"],
  moduleNameMapper: {
    "\\.svg": "<rootDir>/__mocks__/svgrMock.js"
  },
  // Ref https://github.com/facebook/jest/issues/2070#issuecomment-431706685
  // Todo(steve): remove next line when issue fixed.
  modulePathIgnorePatterns: ["<rootDir>/.*/__mocks__"],
  // Use jsdom@14 which supports MutationObserver
  testEnvironment: "jest-environment-jsdom-fourteen",
  timers: "fake"
};
