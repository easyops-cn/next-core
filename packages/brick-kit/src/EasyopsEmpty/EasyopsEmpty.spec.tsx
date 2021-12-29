import React from "react";
import { mount } from "enzyme";
import { Empty } from "antd";
import {
  renderEasyopsEmpty,
  EasyopsEmpty,
  EasyopsEmptyProps,
} from "./EasyopsEmpty";

describe("Empty", () => {
  it("EasyopsEmpty should work", () => {
    const wrapper = mount(<EasyopsEmpty background="grey" />);
    expect(wrapper.find(EasyopsEmpty).length).toBe(1);
    expect(wrapper.find(Empty).prop("image")).toBe("assets/mockFile");
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
    expect((wrapper.find(Empty).prop("image") as string).endsWith(".png")).toBe(
      true
    );
    expect(wrapper.find(Empty).prop("description")).toBe("No content");
  });

  it("EasyopsEmpty should work with the large-sized empty image", () => {
    const props: EasyopsEmptyProps = {
      useBigEmptyImage: true,
    };
    const wrapper = mount(<EasyopsEmpty {...props} />);
    expect(wrapper.find(EasyopsEmpty).length).toBe(1);
  });

  it("renderEasyopsEmpty should work", () => {
    const emptyImage = renderEasyopsEmpty();
    const wrapper = mount(<>{emptyImage}</>);
    expect(wrapper.find(EasyopsEmpty).length).toBe(1);
  });
});
