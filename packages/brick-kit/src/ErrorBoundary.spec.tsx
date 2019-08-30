import React from "react";
import { shallow } from "enzyme";
import { ErrorBoundary } from "./ErrorBoundary";

function Child(): any {
  // this is just a placeholder
  return null;
}

describe("ErrorBoundary", () => {
  it("should show errors", async () => {
    const wrapper = shallow(
      <ErrorBoundary>
        <Child />
      </ErrorBoundary>
    );
    expect(wrapper).toMatchSnapshot();
    const error = new Error("oops");
    wrapper.find(Child).simulateError(error);
    expect(wrapper).toMatchSnapshot();
  });
});
