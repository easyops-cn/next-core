import { describe, it, expect } from "@jest/globals";
import { loadService } from "./loadService.js";

jest.mock("./__dirname.js");

describe("loadService", () => {
  it("should work", async () => {
    const context = loadService("cd");
    expect(await context.toFiles("dist")).toMatchSnapshot();
  });

  it("should work for api_gateway", async () => {
    const context = loadService("api_gateway");
    expect(await context.toFiles("dist")).toMatchSnapshot();
  });
});
