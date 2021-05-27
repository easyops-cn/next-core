const migrateJest = require("./migrateJest");
const fs = require("fs");

jest.mock("fs");

const mockReadFileSync = fs.readFileSync;
const mockWriteFileSync = fs.writeFileSync;

describe("migrateJest", () => {
  it("should work", () => {
    mockReadFileSync.mockReturnValueOnce(
      `module.exports = {
  timers: "fake",
};
`
    );
    mockReadFileSync.mockReturnValueOnce(
      `import { configure } from "enzyme";

global as any).flushPromises = () =>
  act(() => new Promise((resolve) => setImmediate(resolve)));
`
    );
    migrateJest();
    expect(mockWriteFileSync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("jest.config.js"),
      `module.exports = {
  testEnvironment: "jsdom",
  timers: "fake",
};
`
    );
    expect(mockWriteFileSync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("__jest__/setup.ts"),
      `import { setImmediate as flushMicroTasks } from "timers";
import { configure } from "enzyme";

global as any).flushPromises = () =>
  act(() => new Promise((resolve) => flushMicroTasks(resolve)));
`
    );
  });
});
