import React from "react";
import { shallow } from "enzyme";
import { BrickIcon } from "./BrickIcon";

describe("BrickIcon", () => {
  it("should render a default icon", () => {
    const wrapper = shallow(<BrickIcon icon="firewall" />);
    expect(wrapper.prop("className")).toBe(
      "easyops-icon easyops-icon-default-firewall"
    );
  });
  it("should render an app icon", () => {
    const wrapper = shallow(<BrickIcon icon="idc" category="app" />);
    expect(wrapper.prop("className")).toBe("easyops-icon easyops-icon-app-idc");
  });
  it("should render nothing if icon not found", () => {
    const wrapper = shallow(<BrickIcon icon={"not-existed" as any} />);
    expect(wrapper.html()).toBe(null);
  });
});
