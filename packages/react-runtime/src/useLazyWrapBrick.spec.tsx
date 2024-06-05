import React, { Suspense } from "react";
import { describe, test, expect, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { useLazyWrapBrick } from "./useLazyWrapBrick.js";

jest.mock("@next-core/runtime", () => ({
  __secret_internals: {
    loadBricks() {
      return Promise.resolve();
    },
  },
}));

customElements.define(
  "async-dep",
  class extends HTMLElement {
    // Do nothing
  }
);

describe("useLazyWrapBrick", () => {
  test("basic usage", async () => {
    function TestComponent() {
      const DepComponent = useLazyWrapBrick("async-dep");
      return (
        <Suspense fallback="Loading...">
          <DepComponent>I am lazy</DepComponent>
        </Suspense>
      );
    }

    render(<TestComponent />);

    expect(await screen.findByText("Loading...")).toBeTruthy();
    const asyncDep = await screen.findByText("I am lazy");
    expect(asyncDep?.tagName).toBe("ASYNC-DEP");
  });

  test("null brick", async () => {
    function TestComponent() {
      const DepComponent = useLazyWrapBrick(null);
      return (
        <Suspense fallback="Loading...">
          {DepComponent ? "OOPS" : "NULL"}
        </Suspense>
      );
    }

    render(<TestComponent />);

    expect(await screen.findByText("NULL")).toBeTruthy();
  });
});
