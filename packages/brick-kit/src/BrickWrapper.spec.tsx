import React from "react";
import { shallow } from "enzyme";

jest.mock("antd/es/locale/zh_CN");
jest.mock("antd/es/locale/en_US");
import { BrickWrapper } from "./BrickWrapper";

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
