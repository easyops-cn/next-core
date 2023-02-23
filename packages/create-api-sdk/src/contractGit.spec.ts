import { describe, it, expect } from "@jest/globals";
import cp from "node:child_process";
import { clone, checkout } from "./contractGit.js";

jest.mock("./loaders/__dirname.js");

describe("yo-sdk contractGit", () => {
  it("clone should work", async () => {
    jest.spyOn(cp, "spawn").mockImplementationOnce(
      () =>
        ({
          on(type: string, callback: Function) {
            callback(0);
          },
        } as any)
    );
    await clone();
  });

  it("checkout should work", async () => {
    await checkout("");
    jest.spyOn(cp, "spawn").mockImplementationOnce(
      () =>
        ({
          on(type: string, callback: Function) {
            callback(0);
          },
        } as any)
    );
    await checkout("1.0");
  });
});
