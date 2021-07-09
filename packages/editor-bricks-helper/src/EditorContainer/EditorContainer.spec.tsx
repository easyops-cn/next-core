import React from "react";
import { act } from "react-dom/test-utils";
import { mount, shallow } from "enzyme";
import { useBuilderNode } from "../hooks/useBuilderNode";
import { useBuilderDataManager } from "../hooks/useBuilderDataManager";
import { useBuilderContextMenuStatus } from "../hooks/useBuilderContextMenuStatus";
import { useShowRelatedNodesBasedOnEvents } from "../hooks/useShowRelatedNodesBasedOnEvents";
import { useHoverNodeUid } from "../hooks/useHoverNodeUid";
import { useHighlightNodes } from "../hooks/useHighlightNodes";
import { EditorContainer } from "./EditorContainer";
import { BuilderRuntimeNode } from "../interfaces";
import { BuilderDataManager } from "../internal/BuilderDataManager";
import { isCurrentTargetByClassName } from "./isCurrentTargetByClassName";

jest.mock("../hooks/useBuilderNode");
jest.mock("../hooks/useBuilderDataManager");
jest.mock("../hooks/useBuilderContextMenuStatus");
jest.mock("../hooks/useShowRelatedNodesBasedOnEvents");
jest.mock("../hooks/useHoverNodeUid");
jest.mock("../hooks/useHighlightNodes");
jest.mock("./isCurrentTargetByClassName");
jest.mock("../hooks/useDroppingStatus", () => ({
  useDroppingStatus: () => new Map([[9, new Map([["any", true]])]]),
}));

const currentNode: BuilderRuntimeNode = {
  $$uid: 1,
  type: "brick",
  brick: "my-brick",
  id: "B-001",
};
(useBuilderNode as jest.MockedFunction<typeof useBuilderNode>).mockReturnValue(
  currentNode
);

const mockUseBuilderContextMenuStatus = (
  useBuilderContextMenuStatus as jest.MockedFunction<
    typeof useBuilderContextMenuStatus
  >
).mockReturnValue({ active: false });

const mockUseShowRelatedNodesBasedOnEvents = (
  useShowRelatedNodesBasedOnEvents as jest.MockedFunction<
    typeof useShowRelatedNodesBasedOnEvents
  >
).mockReturnValue(true);

(
  useHoverNodeUid as jest.MockedFunction<typeof useHoverNodeUid>
).mockReturnValue(2);

(
  useHighlightNodes as jest.MockedFunction<typeof useHighlightNodes>
).mockReturnValue(new Set([7]));

const mockSetHoverNodeUid = jest.fn();
const mockContextMenuChange = jest.fn();
const mockNodeClick = jest.fn();
const mockGetRelatedNodesBasedOnEventsMap = jest.fn().mockReturnValue(
  new Map([
    [
      2,
      {
        upstreamNodes: new Set([3]),
        downstreamNodes: new Set([4]),
      },
    ],
  ])
);
(
  useBuilderDataManager as jest.MockedFunction<typeof useBuilderDataManager>
).mockReturnValue({
  setHoverNodeUid: mockSetHoverNodeUid,
  contextMenuChange: mockContextMenuChange,
  nodeClick: mockNodeClick,
  getRelatedNodesBasedOnEventsMap: mockGetRelatedNodesBasedOnEventsMap,
} as unknown as BuilderDataManager);

const mockIsCurrentTargetByClassName =
  isCurrentTargetByClassName as jest.MockedFunction<
    typeof isCurrentTargetByClassName
  >;

describe("EditorContainer", () => {
  afterEach(() => {
    jest.clearAllMocks();
    currentNode.$$isTemplateInternalNode = undefined;
  });

  it("should work", () => {
    const wrapper = shallow(<EditorContainer nodeUid={1} />);
    expect(wrapper.find(".editorContainer").hasClass("hover")).toBe(false);
    expect(wrapper.find(".editorContainer").hasClass("highlight")).toBe(false);
    expect(wrapper.find(".nodeAlias").text()).toBe("my-brick");
  });

  it("should apply dropping class", () => {
    const wrapper = shallow(<EditorContainer nodeUid={1} />);
    expect(wrapper.find(".editorContainer").hasClass("dropping")).toBe(false);
    wrapper.setProps({
      nodeUid: 9,
    });
    expect(wrapper.find(".editorContainer").hasClass("dropping")).toBe(true);
  });

  it("should apply highlight class", () => {
    const wrapper = shallow(<EditorContainer nodeUid={7} />);
    expect(wrapper.find(".editorContainer").hasClass("highlight")).toBe(true);
  });

  it("should apply hover class when context menu is active", () => {
    mockUseBuilderContextMenuStatus.mockReturnValueOnce({
      active: true,
      node: currentNode,
    });
    const wrapper = shallow(<EditorContainer nodeUid={1} />);
    expect(wrapper.find(".editorContainer").hasClass("hover")).toBe(true);
  });

  it("should handle mouse enter", () => {
    const wrapper = mount(<EditorContainer nodeUid={1} />);
    expect(wrapper.find(".editorContainer").hasClass("hover")).toBe(false);

    const mockMouseOutEvent = new MouseEvent("mouseout");
    jest.spyOn(mockMouseOutEvent, "stopPropagation");
    act(() => {
      wrapper
        .find(".editorContainer")
        .getDOMNode()
        .dispatchEvent(mockMouseOutEvent);
    });
    wrapper.update();
    expect(mockMouseOutEvent.stopPropagation).toBeCalled();
    expect(mockSetHoverNodeUid).not.toBeCalled();

    const mockMouseOverEvent = new MouseEvent("mouseover");
    jest.spyOn(mockMouseOverEvent, "stopPropagation");
    act(() => {
      wrapper
        .find(".editorContainer")
        .getDOMNode()
        .dispatchEvent(mockMouseOverEvent);
    });
    wrapper.update();
    expect(mockMouseOverEvent.stopPropagation).toBeCalled();
    expect(mockSetHoverNodeUid).toBeCalledWith(1);
    expect(wrapper.find(".editorContainer").hasClass("hover")).toBe(true);
    wrapper.unmount();
  });

  it("should handle mouse leave", () => {
    const wrapper = mount(<EditorContainer nodeUid={2} />);
    expect(wrapper.find(".editorContainer").hasClass("hover")).toBe(true);

    const mockMouseOverEvent = new MouseEvent("mouseover");
    jest.spyOn(mockMouseOverEvent, "stopPropagation");
    act(() => {
      wrapper
        .find(".editorContainer")
        .getDOMNode()
        .dispatchEvent(mockMouseOverEvent);
    });
    wrapper.update();
    expect(mockMouseOverEvent.stopPropagation).toBeCalled();
    expect(mockSetHoverNodeUid).not.toBeCalled();

    const mockMouseOutEvent = new MouseEvent("mouseout");
    jest.spyOn(mockMouseOutEvent, "stopPropagation");
    act(() => {
      wrapper
        .find(".editorContainer")
        .getDOMNode()
        .dispatchEvent(mockMouseOutEvent);
    });
    wrapper.update();
    expect(mockMouseOutEvent.stopPropagation).toBeCalled();
    expect(mockSetHoverNodeUid).toBeCalledWith(undefined);
    expect(wrapper.find(".editorContainer").hasClass("hover")).toBe(false);
    wrapper.unmount();
  });

  it("should ignore mouse events for template internal nodes", () => {
    currentNode.$$isTemplateInternalNode = true;
    const wrapper = mount(<EditorContainer nodeUid={1} />);
    expect(wrapper.find(".editorContainer").hasClass("hover")).toBe(false);

    const mockMouseOverEvent = new MouseEvent("mouseover");
    jest.spyOn(mockMouseOverEvent, "stopPropagation");
    act(() => {
      wrapper
        .find(".editorContainer")
        .getDOMNode()
        .dispatchEvent(mockMouseOverEvent);
    });
    wrapper.update();
    expect(mockMouseOverEvent.stopPropagation).not.toBeCalled();
    wrapper.unmount();
  });

  it("should handle context menu on current target", () => {
    mockIsCurrentTargetByClassName.mockReturnValueOnce(true);
    const mockContextMenuEvent = {
      preventDefault: jest.fn(),
    } as unknown as React.MouseEvent;
    const wrapper = shallow(<EditorContainer nodeUid={1} />);
    wrapper.find(".editorContainer").invoke("onContextMenu")(
      mockContextMenuEvent
    );
    expect(mockContextMenuEvent.preventDefault).toBeCalled();
    expect(mockContextMenuChange).toBeCalledWith(
      expect.objectContaining({
        active: true,
        node: currentNode,
      })
    );
  });

  it("should handle context menu on non-current target", () => {
    mockIsCurrentTargetByClassName.mockReturnValueOnce(false);
    const mockContextMenuEvent = {
      preventDefault: jest.fn(),
    } as unknown as React.MouseEvent;
    const wrapper = shallow(<EditorContainer nodeUid={1} />);
    wrapper.find(".editorContainer").invoke("onContextMenu")(
      mockContextMenuEvent
    );
    expect(mockContextMenuEvent.preventDefault).not.toBeCalled();
    expect(mockContextMenuChange).not.toBeCalled();
  });

  it("should handle click on current target", () => {
    mockIsCurrentTargetByClassName.mockReturnValueOnce(true);
    const wrapper = shallow(<EditorContainer nodeUid={1} />);
    wrapper.find(".editorContainer").invoke("onClick")(
      {} as unknown as React.MouseEvent
    );
    expect(mockNodeClick).toBeCalledWith(currentNode);
  });

  it("should handle click on non-current target", () => {
    mockIsCurrentTargetByClassName.mockReturnValueOnce(false);
    const wrapper = shallow(<EditorContainer nodeUid={1} />);
    wrapper.find(".editorContainer").invoke("onClick")(
      {} as unknown as React.MouseEvent
    );
    expect(mockNodeClick).not.toBeCalled();
  });

  it("should show upstream arrow", () => {
    const wrapper = mount(<EditorContainer nodeUid={3} />);
    expect(wrapper.find(".arrow").text()).toBe("↑");
  });

  it("should show downstream arrow", () => {
    const wrapper = mount(<EditorContainer nodeUid={4} />);
    expect(wrapper.find(".arrow").text()).toBe("↓");
  });

  it("should show downstream arrow", () => {
    mockUseShowRelatedNodesBasedOnEvents.mockReturnValueOnce(false);
    const wrapper = mount(<EditorContainer nodeUid={4} />);
    expect(wrapper.find(".arrow").length).toBe(0);
  });
});
