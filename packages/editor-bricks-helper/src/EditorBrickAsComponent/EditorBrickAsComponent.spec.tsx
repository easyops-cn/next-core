import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { useDrag } from "react-dnd";
import { getRuntime } from "@next-core/brick-kit";
import { UseSingleBrickConf } from "@next-core/brick-types";
import { EditorBrickAsComponent } from "./EditorBrickAsComponent";
import { getEditorBrick } from "./getEditorBrick";
import { BuilderRuntimeNode, EditorSelfLayout } from "../interfaces";
import { useBuilderData } from "../hooks/useBuilderData";
import { useStoryList } from "../hooks/useStoryList";
import { useSharedEditorMap } from "../hooks/useSharedEditorMap";

jest.mock("react-dnd");
jest.mock("@next-core/brick-kit", () => ({
  BrickAsComponent({ useBrick }: { useBrick: UseSingleBrickConf }) {
    return (
      <span>
        BrickAsComponent({useBrick.brick},{useBrick.properties.nodeUid})
      </span>
    );
  },
  getRuntime: jest.fn(),
}));
jest.mock("./getEditorBrick");
jest.mock("../hooks/useBuilderData");
jest.mock("../hooks/useStoryList");
jest.mock("../hooks/useSharedEditorMap");

const mockGetFeatureFlags = jest.fn(); /* .mockReturnValue({}) */
(getRuntime as jest.Mock).mockReturnValue({
  getFeatureFlags: mockGetFeatureFlags,
});

(useDrag as jest.MockedFunction<typeof useDrag>).mockReturnValue([
  { isDragging: false },
  undefined,
  undefined,
]);

(useStoryList as jest.Mock).mockReturnValue([
  {
    type: "brick",
    storyId: "basic-bricks.general-button",
    doc: { editor: "base-button--editor", slots: [], memo: "this is button" },
  },
]);

(useSharedEditorMap as jest.Mock).mockReturnValue(
  new Map([
    [
      "test.brick-a",
      {
        id: "test.brick-a",
        editor: "shared.test-brick--editor",
        editorProps: {
          quality: "good",
        },
      },
    ],
  ])
);

(
  getEditorBrick as jest.MockedFunction<typeof getEditorBrick>
).mockImplementation((node, editor) =>
  Promise.resolve(editor ?? "any-brick--editor")
);

const mockUseBuilderData = useBuilderData as jest.Mock;

customElements.define(
  "any-brick--editor",
  class Tmp extends HTMLElement {
    static get selfLayout(): EditorSelfLayout {
      return undefined;
    }
  }
);

customElements.define(
  "shared.test-brick--editor",
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
    mockGetFeatureFlags.mockReturnValue({});
    const wrapper = mount(
      <EditorBrickAsComponent
        node={
          {
            $$uid: 1,
            instanceId: "instance-a",
            id: "B-1",
            brick: "any-brick",
          } as Partial<BuilderRuntimeNode> as BuilderRuntimeNode
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
    expect(element.hasClass("__isTemplateInternalNode")).toBe(false);
  });

  it("should work for brick which has children", async () => {
    mockUseBuilderData.mockReturnValue({
      edges: [
        {
          parent: 1,
        },
      ],
    });
    mockGetFeatureFlags.mockReturnValue({});
    const wrapper = mount(
      <EditorBrickAsComponent
        node={
          {
            $$uid: 1,
            instanceId: "instance-a",
            id: "B-1",
            brick: "any-brick",
            $$isTemplateInternalNode: true,
          } as Partial<BuilderRuntimeNode> as BuilderRuntimeNode
        }
      />
    );
    await act(async () => {
      await (global as any).flushPromises();
    });
    wrapper.update();

    const element = wrapper.find("div").at(0);
    expect(element.hasClass("selfLayoutContainer")).toBe(true);
    expect(element.hasClass("__isTemplateInternalNode")).toBe(true);
  });

  it("should work when enabled installed-bricks", async () => {
    mockUseBuilderData.mockReturnValue({
      edges: [],
    });
    mockGetFeatureFlags.mockReturnValue({
      "next-builder-installed-bricks": true,
    });
    const wrapper = mount(
      <EditorBrickAsComponent
        node={{
          $$uid: 1,
          instanceId: "instance-a",
          id: "B-1",
          brick: "test.brick-a",
          type: "brick",
        }}
      />
    );
    await act(async () => {
      await (global as any).flushPromises();
    });
    wrapper.update();
    expect(wrapper.text()).toBe(
      "BrickAsComponent(shared.test-brick--editor,1)"
    );
  });
});
