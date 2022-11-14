import React from "react";
import { mount } from "enzyme";
import { Empty } from "antd";
import { useCurrentTheme } from "../themeAndMode";
import {
  renderEasyopsEmpty,
  EasyopsEmpty,
  EasyopsEmptyProps,
} from "./EasyopsEmpty";

jest.mock("../themeAndMode");

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
    expect((wrapper.find(Empty).prop("image") as string).endsWith(".svg")).toBe(
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

  it("EasyopsEmpty should work with the large-sized empty image", () => {
    (useCurrentTheme as jest.Mock).mockReturnValueOnce("dark-v2");
    const props: EasyopsEmptyProps = {
      useBigEmptyImage: false,
    };
    const wrapper = mount(<EasyopsEmpty {...props} />);

    expect(wrapper.find("title").text()).toBe("dark default empty image");

    (useCurrentTheme as jest.Mock).mockReturnValueOnce("dark-v2");
    wrapper.setProps({
      useBigEmptyImage: true,
    });

    wrapper.update();

    expect(wrapper.find("title").text()).toBe("dark big empty image");
  });
});
