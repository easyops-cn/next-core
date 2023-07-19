import { describe, test, expect } from "@jest/globals";
import { loadBricksImperatively } from "@next-core/loader";
import { add, loadBricks } from "./standalone.js";

jest.mock("@next-core/loader");

describe("standalone", () => {
  test("add and loadBricks", async () => {
    add([
      {
        id: "bricks/basic",
        filePath: "bricks/basic/dist/index.abc.js",
      },
    ]);
    expect(window.STANDALONE_BRICK_PACKAGES?.length).toBe(1);
    add(
      [
        {
          id: "bricks/icons",
          filePath: "bricks/icons/dist/index.def.js",
        },
      ],
      "/"
    );
    expect(window.STANDALONE_BRICK_PACKAGES?.length).toBe(2);
    await loadBricks(["basic.general-button"]);
    expect(loadBricksImperatively).toBeCalledWith(
      ["basic.general-button"],
      [
        {
          id: "bricks/basic",
          filePath: "bricks/basic/dist/index.abc.js",
        },
        {
          id: "bricks/icons",
          filePath: "/bricks/icons/dist/index.def.js",
        },
      ]
    );
  });
});
