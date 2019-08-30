import cp from "child_process";
import { clone, checkout } from "./contractGit";

describe("yo-sdk contractGit", () => {
  it("clone should work", () => {
    // @ts-ignore
    jest.spyOn(cp, "spawnSync").mockImplementation(() => ({ status: 233 }));
    expect(clone()).toEqual({ status: 233 });
  });

  it("checkout should work", () => {
    expect(checkout("")).toBe(0);

    // @ts-ignore
    jest.spyOn(cp, "spawnSync").mockImplementation(() => ({ status: 233 }));
    expect(checkout("1.0")).toEqual(233);
  });
});
