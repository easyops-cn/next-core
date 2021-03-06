import React from "react";
import { shallow } from "enzyme";
import { $PascalBrickName$ } from "./$PascalBrickName$";

describe("$PascalBrickName$", () => {
  it("should work", () => {
    const wrapper = shallow(<$PascalBrickName$ />);
    expect(wrapper.find("div").text()).toBe("$CONSTANT_PACKAGE_NAME$ works!");
  });
});
