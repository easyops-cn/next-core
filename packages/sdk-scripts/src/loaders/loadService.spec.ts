import { loadService } from "./loadService";

describe("loadService", () => {
  it("should work", () => {
    const context = loadService("cd");
    expect(context.toFiles("dist")).toMatchSnapshot();
  });
});
