module.exports = {
  setupFilesAfterEnv: ["<rootDir>/__jest__/setup.ts"],
  snapshotSerializers: ["enzyme-to-json/serializer"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "\\.spec\\.[jt]sx?$",
    "/packages/.*-config-factory/",
    "/scripts/",
    "/__jest__/",
  ],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      statements: 94.9,
      branches: 89.4,
      functions: 96.8,
      lines: 94.9,
    },
  },
  coverageDirectory: "<rootDir>/.coverage",
  coverageReporters: ["lcov", "text-summary"],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/template/",
    "/cypress/",
  ],
  moduleNameMapper: {
    "\\.module\\.css$": "identity-obj-proxy",
    "\\.svg": "<rootDir>/__mocks__/svgrMock.js",
    "^[./a-zA-Z0-9$_-]+\\.(bmp|gif|jpg|jpeg|png|psd|svg|webp)$":
      "<rootDir>/__mocks__/fileMock.js",
  },
  // Ref https://github.com/facebook/jest/issues/2070#issuecomment-431706685
  // Todo(steve): remove next line when issue fixed.
  modulePathIgnorePatterns: ["<rootDir>/.*/__mocks__"],
  timers: "fake",
};
