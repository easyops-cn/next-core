import React from "react";
import {
  renderEasyopsEmpty,
  EasyopsEmpty,
  EasyopsEmptyProps,
} from "./EasyopsEmpty";
import { mount } from "enzyme";

describe("Empty", () => {
  it("EasyopsEmpty should work", () => {
    const wrapper = mount(<EasyopsEmpty background="grey" />);
    expect(wrapper.find(EasyopsEmpty).length).toBe(1);
  });

  it("EasyopsEmpty should work with illustration", () => {
    const props: EasyopsEmptyProps = {
      description: "No content",
      illustration: {
        name: "no-content",
      },
    };
    const wrapper = mount(<EasyopsEmpty {...props} />);
    expect(wrapper.find(EasyopsEmpty).length).toBe(1);
    expect(wrapper.find("img").prop("src").endsWith(".png")).toBe(true);
    expect(wrapper.find("p[className='ant-empty-description']").text()).toBe(
      props.description
    );
  });

  it("renderEasyopsEmpty should work", () => {
    const emptyImage = renderEasyopsEmpty();
    const wrapper = mount(<>{emptyImage}</>);
    expect(wrapper.find(EasyopsEmpty).length).toBe(1);
  });
});
