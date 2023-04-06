import { describe, test, expect } from "@jest/globals";
import cp from "node:child_process";
import { clone, checkout } from "./contractGit.js";

jest.mock("./loaders/__dirname.js");

let spawnCode = 0;
const spawn = jest.spyOn(cp, "spawn").mockImplementation(
  () =>
    ({
      on(type: string, callback: Function) {
        callback(spawnCode);
      },
    } as any)
);

describe("yo-sdk contractGit", () => {
  beforeEach(() => {
    spawnCode = 0;
  });

  test("clone", async () => {
    await clone("");

    expect(spawn).toBeCalledWith(
      "git",
      [
        "clone",
        "git@git.easyops.local:anyclouds/contract-center.git",
        "--depth",
        "1",
        expect.stringMatching(/\/contract$/),
      ],
      expect.objectContaining({
        stdio: "inherit",
      })
    );
  });

  test("clone with tag or commit", async () => {
    await clone("1.0");

    expect(spawn).toBeCalledWith(
      "git",
      [
        "clone",
        "git@git.easyops.local:anyclouds/contract-center.git",
        expect.stringMatching(/\/contract$/),
      ],
      expect.objectContaining({
        stdio: "inherit",
      })
    );
  });

  test("clone failed", async () => {
    spawnCode = 1;
    await expect(clone("")).rejects.toBe(1);
  });

  test("checkout", async () => {
    await checkout("");
    expect(spawn).not.toBeCalled();

    await checkout("1.0");
    expect(spawn).toBeCalledWith(
      "git",
      ["checkout", "1.0"],
      expect.objectContaining({
        stdio: "inherit",
      })
    );
  });
  test("checkout failed", async () => {
    spawnCode = 2;
    await expect(checkout("2.0")).rejects.toBe(2);
  });
});
