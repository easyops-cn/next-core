import React from "react";
import { mount } from "enzyme";
import { BrickAsComponent } from "./BrickAsComponent";

describe("BrickAsComponent", () => {
  it("should work", () => {
    const wrapper = mount(
      <BrickAsComponent
        useBrick={{
          brick: "div",
          properties: {
            id: "hello"
          },
          transform: "title",
          transformFrom: "tips"
        }}
        data={{
          tips: "good"
        }}
      />
    );

    expect((wrapper.find("div").getDOMNode() as any).title).toBe("good");
  });
});
