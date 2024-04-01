import React from "react";
import { __secret_internals } from "@next-core/runtime";
import { asyncWrapBrick } from "./asyncWrapBrick.js";
import { render } from "@testing-library/react";

jest.mock("@next-core/runtime", () => ({
  __secret_internals: {
    loadBricks: jest.fn(),
  },
}));

describe("asyncWrapBrick", () => {
  test("basic usage", async () => {
    const Brick = await asyncWrapBrick("async-dep");
    expect(__secret_internals.loadBricks).toHaveBeenCalledWith(["async-dep"]);
    const { container } = render(<Brick />);
    expect((container.firstChild as HTMLElement).tagName).toBe("ASYNC-DEP");
  });
});
