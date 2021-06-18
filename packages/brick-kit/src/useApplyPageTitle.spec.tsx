import React from "react";
import { mount } from "enzyme";
import { useApplyPageTitle } from "./useApplyPageTitle";
import * as runtime from "./runtime";

const applyPageTitle = jest.fn();
jest.spyOn(runtime, "getRuntime").mockReturnValue({
  applyPageTitle,
} as any);

function HookWrapper(props: { pageTitle?: string }): React.ReactElement {
  useApplyPageTitle(props.pageTitle);
  return <div>HookWrapper</div>;
}

describe("useApplyPageTitle", () => {
  it("should work", () => {
    const wrapper = mount(<HookWrapper />);
    expect(applyPageTitle).toHaveBeenNthCalledWith(1, undefined);
    wrapper.setProps({ pageTitle: "Hello" });
    expect(applyPageTitle).toHaveBeenNthCalledWith(2, "Hello");
  });
});
