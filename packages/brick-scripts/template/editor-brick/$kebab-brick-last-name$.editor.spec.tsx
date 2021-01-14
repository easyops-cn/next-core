import React from "react";
import { shallow } from "enzyme";
import * as helper from "@easyops/editor-bricks-helper";
import { $PascalBrickName$Editor } from "./$kebab-brick-last-name$.editor";

jest.spyOn(helper, "useBuilderNode").mockReturnValue({
  type: "brick",
  id: "B-001",
  brick: "$kebab-brick-last-name$",
  alias: "my-brick",
  parsedProperties: {},
});

describe("$PascalBrickName$Editor", () => {
  it("should work", () => {
    const wrapper = shallow(
      <$PascalBrickName$Editor nodeUid={1} brick="$kebab-brick-last-name$" />
    );
    expect(wrapper.find("div").text()).toBe("my-brick");
  });
});
