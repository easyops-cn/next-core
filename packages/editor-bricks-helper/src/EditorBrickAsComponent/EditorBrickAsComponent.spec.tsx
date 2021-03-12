import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { useDrag } from "react-dnd";
import { UseSingleBrickConf } from "@next-core/brick-types";
import { EditorBrickAsComponent } from "./EditorBrickAsComponent";
import { getEditorBrick } from "./getEditorBrick";
import { BuilderRuntimeNode, EditorSelfLayout } from "../interfaces";
import { useBuilderData } from "../hooks/useBuilderData";

jest.mock("react-dnd");
jest.mock("@next-core/brick-kit", () => ({
  BrickAsComponent({ useBrick }: { useBrick: UseSingleBrickConf }) {
    return (
      <span>
        BrickAsComponent({useBrick.brick},{useBrick.properties.nodeUid})
      </span>
    );
  },
}));
jest.mock("./getEditorBrick");
jest.mock("../hooks/useBuilderData");

(useDrag as jest.MockedFunction<typeof useDrag>).mockReturnValue([
  { isDragging: false },
  undefined,
  undefined,
]);

(getEditorBrick as jest.MockedFunction<
  typeof getEditorBrick
>).mockResolvedValue("any-brick--editor");

const mockUseBuilderData = useBuilderData as jest.Mock;

customElements.define(
  "any-brick--editor",
  class Tmp extends HTMLElement {
    static get selfLayout(): EditorSelfLayout {
      return undefined;
    }
  }
);

describe("EditorBrickAsComponent", () => {
  it("should work", async () => {
    mockUseBuilderData.mockReturnValue({
      edges: [],
    });
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
    expect(wrapper.text()).toBe("BrickAsComponent(any-brick--editor,1)");

    const element = wrapper.find("div").at(0);
    expect(element.hasClass("dragging")).toBe(false);
    expect(element.hasClass("selfLayoutInline")).toBe(true);
  });

  it("should work for brick which has children", async () => {
    mockUseBuilderData.mockReturnValue({
      edges: [
        {
          parent: 1,
        },
      ],
    });
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

    const element = wrapper.find("div").at(0);
    expect(element.hasClass("selfLayoutContainer")).toBe(true);
  });
});
