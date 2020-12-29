import React from "react";
import { act } from "react-dom/test-utils";
import { HTMLAttributes, mount, ReactWrapper } from "enzyme";
import { BrickAsComponent } from "@easyops/brick-kit";
import { UseSingleBrickConf } from "@easyops/brick-types";
import { EditorBrickAsComponent } from "./EditorBrickAsComponent";
import { getEditorBrick } from "./getEditorBrick";
import { BuilderRuntimeNode, EditorSelfLayout } from "../interfaces";
import { setDataOfDataTransfer } from "../DataTransferHelper";

jest.mock("@easyops/brick-kit");
jest.mock("./getEditorBrick");
jest.mock("../DataTransferHelper");

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

const mockSetDataOfDataTransfer = setDataOfDataTransfer as jest.MockedFunction<
  typeof setDataOfDataTransfer
>;

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

    const getContainer = (): ReactWrapper<HTMLAttributes> =>
      wrapper.find("div").at(0);
    const getDragZone = (): ReactWrapper<HTMLAttributes> =>
      wrapper.find("[draggable]");

    expect(getContainer().prop("className")).not.toContain("dragging");

    // Trigger a dragstart event which target to other than itself,
    // which should result in event ignored.
    getDragZone().invoke("onDragStart")({
      target: "fake",
    } as any);
    expect(mockSetDataOfDataTransfer).not.toBeCalled();
    expect(getContainer().prop("className")).not.toContain("dragging");

    // Trigger a dragstart event which target to itself.
    const mockDragStartEvent = {
      target: getDragZone().getDOMNode(),
      dataTransfer: {},
    } as any;
    getDragZone().invoke("onDragStart")(mockDragStartEvent);
    expect(mockSetDataOfDataTransfer).toBeCalledWith({}, "text/node-to-move", {
      nodeUid: 1,
      nodeInstanceId: "instance-a",
      nodeId: "B-1",
    });
    expect(mockDragStartEvent.effectAllowed).toBe("move");
    expect(getContainer().prop("className")).toContain("dragging");

    // Trigger a dragend event which target to other than itself,
    // which should result in event ignored.
    getDragZone().invoke("onDragEnd")({
      target: "fake",
    } as any);
    expect(getContainer().prop("className")).toContain("dragging");

    // Trigger a dragend event which target to itself.
    const mockClearData = jest.fn();
    const mockDragEndEvent = {
      target: getDragZone().getDOMNode(),
      dataTransfer: {
        clearData: mockClearData,
      },
    } as any;
    getDragZone().invoke("onDragEnd")(mockDragEndEvent);
    expect(getContainer().prop("className")).not.toContain("dragging");
    expect(mockClearData).toBeCalled();
  });
});
