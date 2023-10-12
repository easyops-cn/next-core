import { loadBricksImperatively } from "@next-core/loader";
import { loadUIPatch } from "./UIPatch.js";
import { createProviderClass } from "@next-core/utils/general";

let mockFlag = true;
jest.mock("@next-core/loader", () => ({
  loadBricksImperatively: jest.fn(async () => {
    return mockFlag ? Promise.resolve() : Promise.reject("fail");
  }),
}));

const mockProviderElement = jest.fn();
customElements.define(
  "basic.apply-ui-version",
  createProviderClass(mockProviderElement)
);

const consoleWarn = jest.spyOn(console, "warn");

describe("UIPatch", () => {
  test("success", async () => {
    expect(loadBricksImperatively).not.toBeCalled();

    await loadUIPatch("8.0");

    expect(loadBricksImperatively).toBeCalled();

    expect(mockProviderElement).toBeCalledWith("8.0");

    expect(consoleWarn).not.toBeCalled();
  });

  test("fail", async () => {
    mockFlag = false;
    expect(loadBricksImperatively).not.toBeCalled();

    const elemnt = await loadUIPatch("8.0");

    expect(loadBricksImperatively).toBeCalled();

    expect(elemnt).not.toBeDefined();

    expect(consoleWarn).toBeCalledWith("Load ui-adapter failed:", "fail");
  });
});
