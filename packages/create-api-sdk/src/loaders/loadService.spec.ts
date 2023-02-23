import { describe, it, expect } from "@jest/globals";
import { loadService } from "./loadService.js";

jest.mock("./__dirname.js");

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
