import { loadService } from "./loadService";

describe("loadService", () => {
  it("should work", () => {
    const context = loadService("cd");
    expect(context.toFiles("dist")).toMatchSnapshot();
  });

  it("should work for api_gateway", () => {
    const context = loadService("api_gateway");
    expect(context.toFiles("dist")).toMatchSnapshot();
  });
});
