import React from "react";
import { renderEasyopsEmpty, EasyopsEmpty } from "./EasyopsEmpty";
import { mount } from "enzyme";

describe("Empty", () => {
  it("EasyopsEmpty should work", () => {
    const wrapper = mount(<EasyopsEmpty background="grey" />);
    expect(wrapper.find(EasyopsEmpty).length).toBe(1);
  });

  it("renderEasyopsEmpty should work", () => {
    const emptyImage = renderEasyopsEmpty();
    const wrapper = mount(<>{emptyImage}</>);
    expect(wrapper.find(EasyopsEmpty).length).toBe(1);
  });
});
