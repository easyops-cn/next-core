import React from "react";
import { mount } from "enzyme";
import * as utils from "@easyops/brick-utils";
import { BrickAsComponent } from "./BrickAsComponent";

const bindListeners = jest.spyOn(utils, "bindListeners");

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
          transformFrom: "tips",
          events: {
            "button.click": {
              action: "console.log",
              args: ["@{tips}"]
            }
          }
        }}
        data={{
          tips: "good"
        }}
      />
    );

    expect((wrapper.find("div").getDOMNode() as any).title).toBe("good");
    expect(bindListeners.mock.calls[0][1]).toEqual({
      "button.click": {
        action: "console.log",
        args: ["good"]
      }
    });
  });
});
