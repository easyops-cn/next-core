module.exports = {
  setupFilesAfterEnv: ["<rootDir>/__jest__/setup.ts"],
  snapshotSerializers: [
    "enzyme-to-json/serializer"
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "\\.spec\\.[jt]sx?$",
    "/packages/.*-config-factory/"
  ],
  collectCoverage: true,
  collectCoverageFrom: ["packages/*/src/**/*.{ts,tsx,js,jsx}"],
  coverageThreshold: {
    global: {
      statements: 86.76,
      branches: 77.49,
      functions: 86.17,
      lines: 86.61
    }
  },
  coverageDirectory: "<rootDir>/.coverage",
  coverageReporters: ["lcov", "text-summary"],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest"
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/template/"],
  // Ref https://github.com/facebook/jest/issues/2070#issuecomment-431706685
  // Todo(steve): remove next line when issue fixed.
  modulePathIgnorePatterns: [
    "<rootDir>/packages/[^/]*/src/.*/__mocks__"
  ],
  // Use jsdom@14 which supports MutationObserver
  testEnvironment: "jest-environment-jsdom-fourteen",
  timers: "fake"
};
