import React from "react";
import { shallow } from "enzyme";
import * as helper from "@easyops/editor-bricks-helper";
import { $PascalBrickName$Editor } from "./$kebab-brick-last-name$.editor";

const mockUseBuilderNode = jest.spyOn(helper, "useBuilderNode");

describe("$PascalBrickName$Editor", () => {
  it("should work", () => {
    mockUseBuilderNode.mockReturnValueOnce({
      type: "brick",
      id: "B-001",
      brick: "$kebab-brick-last-name$",
      alias: "my-brick",
      parsedProperties: {},
    });
    const wrapper = shallow(
      <$PascalBrickName$Editor nodeUid={1} brick="$kebab-brick-last-name$" />
    );
    expect(wrapper.find("div").text()).toBe("my-brick");
  });
});
