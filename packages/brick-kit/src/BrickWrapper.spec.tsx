import React from "react";
import { mount, shallow } from "enzyme";
import { BrickWrapper } from "./BrickWrapper";
import { Empty, Table } from "antd";

jest.mock("i18next", () => ({ language: "zh" }));
jest.mock("antd/es/locale/zh_CN", () => "zh_CN");
jest.mock("antd/es/locale/en_US", () => "en_US");

describe("brick wrapper", () => {
  it("should work", () => {
    const wrapper = shallow(
      <BrickWrapper>
        <div>hello, brick-wrapper</div>
      </BrickWrapper>
    );
    expect(wrapper).toMatchSnapshot();
  });

  it("should work", () => {
    const wrapper = mount(
      <BrickWrapper>
        <Table />
      </BrickWrapper>
    );
    expect(wrapper.find(Empty).length).toBe(1);
  });
});
