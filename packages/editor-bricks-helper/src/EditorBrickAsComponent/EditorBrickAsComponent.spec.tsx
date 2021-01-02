import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { useDrag } from "react-dnd";
import { BrickAsComponent } from "@easyops/brick-kit";
import { UseSingleBrickConf } from "@easyops/brick-types";
import { EditorBrickAsComponent } from "./EditorBrickAsComponent";
import { getEditorBrick } from "./getEditorBrick";
import { BuilderRuntimeNode, EditorSelfLayout } from "../interfaces";

jest.mock("react-dnd");
jest.mock("@easyops/brick-kit");
jest.mock("./getEditorBrick");

(useDrag as jest.MockedFunction<typeof useDrag>).mockReturnValue([
  { isDragging: false },
  undefined,
  undefined,
]);

(getEditorBrick as jest.MockedFunction<
  typeof getEditorBrick
>).mockResolvedValue("any-brick--editor");

(BrickAsComponent as jest.MockedFunction<
  typeof BrickAsComponent
>).mockImplementation(function MockBrickAsComponent({ useBrick }) {
  return (
    <span>
      BrickAsComponent({(useBrick as UseSingleBrickConf).brick},
      {(useBrick as UseSingleBrickConf).properties.nodeUid},
      {(useBrick as UseSingleBrickConf).properties.brick})
    </span>
  );
});

customElements.define(
  "any-brick--editor",
  class Tmp extends HTMLElement {
    static get selfLayout(): EditorSelfLayout {
      return EditorSelfLayout.INLINE;
    }
  }
);

describe("EditorBrickAsComponent", () => {
  it("should work", async () => {
    const wrapper = mount(
      <EditorBrickAsComponent
        node={
          ({
            $$uid: 1,
            instanceId: "instance-a",
            id: "B-1",
            brick: "any-brick",
          } as Partial<BuilderRuntimeNode>) as BuilderRuntimeNode
        }
      />
    );
    await act(async () => {
      await (global as any).flushPromises();
    });
    wrapper.update();
    expect(wrapper.text()).toBe(
      "BrickAsComponent(any-brick--editor,1,any-brick)"
    );

    expect(wrapper.find("div").at(0).prop("className")).not.toContain(
      "dragging"
    );
  });
});
