import React from "react";
import { shallow } from "enzyme";
import { BrickWrapper } from "./BrickWrapper";

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
});
