import { omit, sortBy } from "lodash";
import EventTarget from "@ungap/event-target";
import {
  BuilderRouteOrBrickNode,
  BuilderRouteNode,
  Story,
  BuilderCustomTemplateNode,
} from "@next-core/brick-types";
import { computeConstantCondition, JsonStorage } from "@next-core/brick-utils";
import {
  BuilderCanvasData,
  BuilderContextMenuStatus,
  BuilderRuntimeEdge,
  BuilderRuntimeNode,
  EventDetailOfNodeAdd,
  EventDetailOfNodeAddStored,
  EventDetailOfNodeMove,
  EventDetailOfNodeReorder,
  EventDetailOfContextUpdated,
  SnippetNodeDetail,
  EventDetailOfSnippetApply,
  EventDetailOfSnippetApplyStored,
  SharedEditorConf,
  BuilderDroppingStatus,
  WorkbenchTreeNodeMoveProps,
  EventDetailOfWorkbenchTreeNodeMove,
  WorkbenchNodeAdd,
} from "../interfaces";
import { getUniqueNodeId } from "./getUniqueNodeId";
import { reorderBuilderEdges } from "./reorderBuilderEdges";
import { deleteNodeFromTree } from "./deleteNodeFromTree";
import {
  getRelatedNodesBasedOnEvents,
  RelatedNodesBasedOnEventsMap,
} from "../processors/getRelatedNodesBasedOnEvents";
import { expandTemplateEdges } from "./expandTemplateEdges";
import { getAppendingNodesAndEdges } from "./getAppendingNodesAndEdges";
import { isParentExpandableTemplate } from "./isParentExpandableTemplate";
import { getSnippetNodeDetail } from "../DropZone/getSnippetNodeDetail";
import { getObjectIdByNode } from "./getObjectIdByNode";
import { isBrickNode, isRouteNode } from "../assertions";

enum BuilderInternalEventType {
  NODE_ADD = "builder.node.add",
  NODE_MOVE = "builder.node.move",
  NODE_REORDER = "builder.node.reorder",
  NODE_CLICK = "builder.node.click",
  NODE_UPDATE = "builder.node.update",
  SNIPPET_APPLY = "builder.snippet.apply",
  CONTEXT_MENU_CHANGE = "builder.contextMenu.change",
  DATA_CHANGE = "builder.data.change",
  SHARED_EDITOR_LIST_CHANGE = "builder.sharedEditorList.change",
  ROUTE_LIST_CHANGE = "builder.routeList.change",
  HOVER_NODE_CHANGE = "builder.hoverNode.change",
  ACTIVE_NODE_CHANGE = "builder.activeNode.change",
  SHOW_RELATED_NODES_BASED_ON_EVENTS = "builder.showRelatedNodesBasedOnEvents.change",
  HIGHLIGHT_NODES_CHANGE = "builder.highlightNodes.change",
  OUTLINE_DISABLED_NODES_CHANGE = "builder.outlineDisabledNodes.change",
  DROPPING_STATUS_CHANGE = "builder.droppingStatus.change",
  WORKBENCH_TREE_NODE_MOVE = "workbench.tree.node.move",
}

const storageKeyOfOutlineDisabledNodes = "builder-outline-disabled-nodes";

export class BuilderDataManager {
  private data: BuilderCanvasData = {
    rootId: null,
    nodes: [],
    edges: [],
    wrapperNode: null,
  };

  private hoverNodeUid: number;
  private activeNodeUid: number;

  private sharedEditorList: SharedEditorConf[];

  private routeList: BuilderRouteNode[];

  private storyList: Story[];

  private readonly eventTarget = new EventTarget();

  private contextMenuStatus: BuilderContextMenuStatus = {
    active: false,
  };

  private showRelatedNodesBasedOnEvents: boolean;

  private relatedNodesBasedOnEventsMap: RelatedNodesBasedOnEventsMap;

  private highlightNodes: Set<number> = new Set();

  private templateSourceMap: Map<string, BuilderCustomTemplateNode>;

  private droppingStatus: BuilderDroppingStatus = new Map();

  private readonly localJsonStorage = new JsonStorage<{
    [storageKeyOfOutlineDisabledNodes]: string[];
  }>(localStorage);

  private readonly outlineDisabledNodes: Set<string> = new Set(
    this.localJsonStorage.getItem(storageKeyOfOutlineDisabledNodes) ?? []
  );

  getData(): BuilderCanvasData {
    return this.data;
  }

  getContextMenuStatus(): BuilderContextMenuStatus {
    return this.contextMenuStatus;
  }

  getRelatedNodesBasedOnEventsMap(): RelatedNodesBasedOnEventsMap {
    return this.relatedNodesBasedOnEventsMap;
  }

  sharedEditorListInit(data: SharedEditorConf[]): void {
    this.sharedEditorList = data;
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.SHARED_EDITOR_LIST_CHANGE)
    );
  }

  getSharedEditorList(): SharedEditorConf[] {
    return this.sharedEditorList ?? [];
  }

  onSharedEditorListChange(fn: EventListener): () => void {
    this.eventTarget.addEventListener(
      BuilderInternalEventType.SHARED_EDITOR_LIST_CHANGE,
      fn
    );
    return (): void => {
      this.eventTarget.removeEventListener(
        BuilderInternalEventType.SHARED_EDITOR_LIST_CHANGE,
        fn
      );
    };
  }

  routeListInit(data: BuilderRouteNode[]): void {
    this.routeList = data;
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.ROUTE_LIST_CHANGE)
    );
  }

  getRouteList(): BuilderRouteNode[] {
    return this.routeList ?? [];
  }

  storyListInit(data: Story[]): void {
    this.storyList = data;
  }

  getStoryList(): Story[] {
    return this.storyList;
  }

  onRouteListChange(fn: EventListener): () => void {
    this.eventTarget.addEventListener(
      BuilderInternalEventType.ROUTE_LIST_CHANGE,
      fn
    );
    return (): void => {
      this.eventTarget.removeEventListener(
        BuilderInternalEventType.ROUTE_LIST_CHANGE,
        fn
      );
    };
  }

  dataInit(
    root: BuilderRuntimeNode,
    templateSourceMap?: Map<string, BuilderCustomTemplateNode>
  ): void {
    this.templateSourceMap = templateSourceMap;
    const rootId = getUniqueNodeId();
    const newData = {
      rootId,
      ...getAppendingNodesAndEdges(
        root,
        rootId,
        templateSourceMap,
        this.storyList,
        true
      ),
    };
    this.data = {
      ...newData,
      edges: expandTemplateEdges(newData),
    };
    this.triggerDataChange();
  }

  private triggerDataChange(): void {
    const { rootId, nodes } = this.data;
    const rootNode = nodes.find((node) => node.$$uid === rootId);
    const rootNodeIsCustomTemplate = rootNode.type === "custom-template";
    this.relatedNodesBasedOnEventsMap = getRelatedNodesBasedOnEvents(
      nodes,
      rootNodeIsCustomTemplate
    );
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.DATA_CHANGE, {
        detail: this.data,
      })
    );
  }

  private runAddNodeAction(detail: EventDetailOfNodeAdd): void {
    const { rootId, nodes, edges, wrapperNode } = this.data;
    const { nodeUid, parentUid, nodeUids, nodeData, sort } = detail;

    const { nodes: addNodes, edges: addEdges } = getAppendingNodesAndEdges(
      omit(nodeData, [
        "parent",
      ]) as Partial<BuilderRouteOrBrickNode> as BuilderRouteOrBrickNode,
      nodeUid,
      this.templateSourceMap,
      this.getStoryList()
    );
    const newNodes = nodes.concat(addNodes);
    const newEdges = edges
      .concat({
        parent: parentUid,
        child: nodeUid,
        mountPoint: nodeData.mountPoint,
        sort: sort ?? undefined,
        $$isTemplateDelegated: isParentExpandableTemplate(nodes, parentUid),
      })
      .concat(addEdges);

    const newData = {
      rootId,
      nodes: newNodes,
      edges: newEdges,
      wrapperNode,
    };
    this.data = {
      ...newData,
      edges: reorderBuilderEdges(newData, {
        parentUid,
        nodeUids,
      }),
    };
    this.triggerDataChange();
  }

  updateBrick(detail: EventDetailOfNodeAdd): void {
    this.data = deleteNodeFromTree(detail.nodeUid, this.data);

    this.runAddNodeAction(detail);
  }

  updateNode(instanceId: string, detail: BuilderRuntimeNode): void {
    const { rootId, nodes, edges, wrapperNode } = this.data;
    const updateNode = nodes.find((item) => item.instanceId === instanceId);
    const newNodes = nodes.map((item) => {
      if (item.instanceId === instanceId) {
        let unreachable = false;
        const normalized = detail.$$normalized;
        if (
          normalized?.if !== undefined &&
          (isBrickNode(item) || isRouteNode(item))
        ) {
          const check = { if: normalized.if };
          computeConstantCondition(check);
          if (check.if === false) {
            unreachable = true;
          }
        }
        return {
          ...item,
          ...detail,
          $$unreachable: unreachable,
        };
      }
      return item;
    });
    const newEdges =
      detail.mountPoint === undefined || detail.mountPoint === null
        ? edges
        : edges.map((item) => {
            if (item.child === updateNode.$$uid) {
              return {
                ...item,
                mountPoint: detail.mountPoint,
              };
            }
            return item;
          });
    this.data = {
      rootId,
      nodes: newNodes,
      edges: newEdges,
      wrapperNode,
    };
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.NODE_UPDATE, {
        detail: this.data,
      })
    );
  }

  private redirectMountPoint(
    detail: EventDetailOfNodeAdd | EventDetailOfNodeMove | SnippetNodeDetail
  ): void {
    const { rootId, wrapperNode } = this.data;
    if (detail.parentUid === rootId) {
      detail.nodeData.mountPoint = "bricks";
    }
    if (wrapperNode && wrapperNode.instanceId === detail.nodeData.parent) {
      detail.nodeData.mountPoint = "content";
    }
  }

  private redirectSnippetMountPoint(detail: EventDetailOfSnippetApply): void {
    detail.nodeDetails?.forEach((item) => {
      this.redirectMountPoint(item);
    });
  }

  nodeAdd(detail: EventDetailOfNodeAdd): void {
    this.redirectMountPoint(detail);
    this.runAddNodeAction(detail);

    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.NODE_ADD, { detail })
    );
  }

  nodeAddStored(detail: EventDetailOfNodeAddStored): void {
    const { rootId, nodes, edges, wrapperNode } = this.data;
    const { nodeUid, nodeData } = detail;
    this.data = {
      rootId,
      nodes: nodes.map((node) =>
        node.$$uid === nodeUid
          ? { ...node, id: nodeData.id, instanceId: nodeData.instanceId }
          : node
      ),
      edges,
      wrapperNode,
    };
    this.triggerDataChange();
  }

  snippetApply(detail: EventDetailOfSnippetApply): void {
    this.redirectSnippetMountPoint(detail);
    const { rootId, nodes, edges, wrapperNode } = this.data;
    const { nodeDetails, parentUid, nodeUids } = detail;

    const newNodes: BuilderRuntimeNode[] = nodes.slice();
    const newEdges: BuilderRuntimeEdge[] = edges.slice();

    const walk = ({
      parentUid,
      nodeUid,
      nodeData,
      children,
    }: SnippetNodeDetail): void => {
      const { nodes: appendingNodes, edges: appendingEdges } =
        getAppendingNodesAndEdges(
          omit(nodeData, [
            "parent",
          ]) as Partial<BuilderRouteOrBrickNode> as BuilderRouteOrBrickNode,
          nodeUid,
          this.templateSourceMap,
          this.storyList
        );
      newNodes.push(...appendingNodes);
      newEdges.push(
        {
          parent: parentUid,
          child: nodeUid,
          mountPoint: nodeData.mountPoint,
          sort: nodeData.sort,
          $$isTemplateDelegated: isParentExpandableTemplate(
            newNodes,
            parentUid
          ),
        },
        ...appendingEdges
      );
      for (const item of children) {
        walk(item);
      }
    };

    for (const item of nodeDetails) {
      walk(item);
    }

    const newData = {
      rootId,
      nodes: newNodes,
      edges: newEdges,
      wrapperNode,
    };
    this.data = {
      ...newData,
      edges: reorderBuilderEdges(newData, {
        parentUid,
        nodeUids,
      }),
    };
    this.triggerDataChange();
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.SNIPPET_APPLY, { detail })
    );
  }

  snippetApplyStored(detail: EventDetailOfSnippetApplyStored): void {
    const { rootId, nodes, edges, wrapperNode } = this.data;
    const { flattenNodeDetails } = detail;
    this.data = {
      rootId,
      nodes: nodes.map((node) => {
        const found = flattenNodeDetails.find((n) => n.nodeUid === node.$$uid);
        return found
          ? {
              ...node,
              id: found.nodeData.id,
              instanceId: found.nodeData.instanceId,
            }
          : node;
      }),
      edges,
      wrapperNode,
    };
    this.triggerDataChange();
  }

  /**
   * Move node anywhere by drag-n-drop.
   * @deprecated use `moveNode` instead.
   */
  nodeMove(detail: EventDetailOfNodeMove): void {
    const { rootId, nodes, edges, wrapperNode } = this.data;
    this.redirectMountPoint(detail);
    const { nodeUid, parentUid, nodeUids, nodeData } = detail;
    const newData = {
      rootId,
      nodes,
      edges: edges
        .filter((edge) => edge.child !== nodeUid)
        .concat({
          parent: parentUid,
          child: nodeUid,
          mountPoint: nodeData.mountPoint,
          sort: undefined,
          $$isTemplateDelegated: isParentExpandableTemplate(nodes, parentUid),
        }),
      wrapperNode,
    };
    this.data = {
      ...newData,
      edges: reorderBuilderEdges(newData, {
        parentUid,
        nodeUids,
      }),
    };
    this.triggerDataChange();
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.NODE_MOVE, { detail })
    );
  }

  /**
   * Move node up or down.
   */
  moveNode(
    { $$uid: nodeUid }: BuilderRuntimeNode,
    direction: "up" | "down"
  ): void {
    const { parent: parentUid, mountPoint } = this.data.edges.find(
      (edge) => edge.child === nodeUid
    );
    const { relatedEdges, mountPoints } = getRelatedEdgesAndMountPoint(
      this.data.edges,
      parentUid
    );
    /** Edges of the same mount-point */
    const siblingEdges = relatedEdges.filter(
      (edge) => edge.mountPoint === mountPoint
    );
    const index = siblingEdges.findIndex((edge) => edge.child === nodeUid);
    const orderedSiblingEdges = moveItemInList(siblingEdges, index, direction);
    if (!orderedSiblingEdges) {
      return;
    }
    const orderedEdges = sortBy(
      relatedEdges,
      (edge) => mountPoints.indexOf(edge.mountPoint),
      (edge) => orderedSiblingEdges.indexOf(edge)
    );
    this.reorder(parentUid, orderedEdges);
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.NODE_UPDATE, {
        detail: this.data,
      })
    );
  }

  private getDragInfo({
    nodeData,
    dragNodeUid,
    dragOverNodeUid,
    dragStatus,
  }: {
    nodeData: BuilderRuntimeNode;
    dragNodeUid: number;
    dragOverNodeUid: number;
    dragStatus: string;
  }) {
    const { rootId, nodes, edges } = this.data;
    const isDragRoot = dragOverNodeUid === rootId;
    /*
     * 如果找不到edge, 则为新增状态, 否则为移动状态
     */
    const dragEdge = edges.find((item) => item.child === dragNodeUid);
    const dragOverEdge = edges.find((item) => item.child === dragOverNodeUid);
    /**
     * 如果是根节点, 则mountPoint强制等于 bricks
     * 如果是属于拖动进某个节点中, 默认使用 content
     * 其他情况, 使用被拖拽节点的mountPoint
     */
    const mountPoint = isDragRoot
      ? "bricks"
      : dragStatus === "inside"
      ? "content"
      : dragOverEdge.mountPoint;

    const parentEdge = edges.find((item) => item.child === dragOverNodeUid);
    /**
     * 如果是根节点, parentUid强制等于rootId
     * 如果是拖动进某个节点, 则当前节点为该节点parent
     * 否则, 等于该节点的父节点
     */
    const parentUid = isDragRoot
      ? rootId
      : dragStatus === "inside"
      ? parentEdge.child
      : parentEdge.parent;
    const parnetNodeData = nodes.find((item) => item.$$uid === parentUid);
    // 找到节点父亲等于拖动节点的父节点(寻找兄弟节点)
    const siblingEdge = edges.filter(
      (edge) => edge.child !== dragNodeUid && edge.parent === parentUid
    );
    const sortUids = sortBy(siblingEdge, "sort").map((item) => item.child);
    const sortNodeIds: string[] = [];
    const sortNodeInstanceIds: string[] = [];
    sortUids.forEach((item) => {
      const node = nodes.find((node) => node.$$uid === item);
      sortNodeIds.push(node.id);
      sortNodeInstanceIds.push(node.instanceId);
    });
    let sortIndex: number;
    if (dragStatus === "inside") {
      sortIndex = siblingEdge.length
        ? Math.max(...siblingEdge.map((item) => item.sort)) + 1
        : 0;
      // 插入默认插最后
      sortNodeIds.push(nodeData.id);
      sortNodeInstanceIds.push(nodeData.instanceId);
    } else if (dragStatus === "top" || dragStatus === "bottom") {
      const overIndex = sortUids.findIndex((item) => item === dragOverNodeUid);
      sortIndex = dragStatus === "top" ? overIndex : overIndex + 1;
      // 排序修正
      sortNodeIds.splice(sortIndex, 0, nodeData.id);
      // 如果是新增的情况下, 没有edge, 则取dragNodeUid(新创建的uid)
      sortUids.splice(sortIndex, 0, dragEdge?.child ?? dragNodeUid);
      sortNodeInstanceIds.splice(sortIndex, 0, nodeData.instanceId);
    }

    return {
      parentUid,
      mountPoint,
      sortIndex,
      parnetNodeData,
      sortUids,
      sortNodeIds,
      sortNodeInstanceIds,
    };
  }

  workbenchNodeAdd(
    detail: WorkbenchNodeAdd,
    isNeedUpdateSnippet = true
  ): void | EventDetailOfSnippetApply {
    const { nodes, edges, rootId } = this.data;
    const { nodeData, dragOverInstanceId, dragStatus, mountPoint } = detail;
    if (nodeData.instanceId && !nodeData.instanceId.startsWith("mock")) {
      // move
    } else {
      // insert
      const parentInstanceId = detail.parent || detail.parentInstanceId;
      const newNodeUid = nodeData.$$uid || getUniqueNodeId();
      const overNode = nodes.find(
        (item) => item.instanceId === dragOverInstanceId
      );
      let dragOverNodeUid = overNode.$$uid;
      let realDragStatus = dragStatus;
      if (dragOverNodeUid === rootId) {
        realDragStatus = "inside";
      } else {
        const overEdge = edges.find((item) => item.child === dragOverNodeUid);
        const overParentNode = nodes.find((item) =>
          dragStatus === "inside"
            ? item.$$uid === overEdge.child
            : item.$$uid === overEdge.parent
        );

        if (overParentNode.instanceId !== parentInstanceId) {
          // 如果instanceId不相同, 说明父元素被修改, dragStatus强制等于inside, uid也需要切换成实际父元素的uid
          realDragStatus = "inside";
          dragOverNodeUid = nodes.find(
            (item) => item.instanceId === parentInstanceId
          ).$$uid;
        }
      }

      const {
        parentUid,
        sortIndex,
        sortUids: nodeUids,
        sortNodeIds: nodeIds,
        sortNodeInstanceIds: nodeInstanceIds,
      } = this.getDragInfo({
        nodeData: {
          id: nodeData.id ?? null,
          instanceId: nodeData.instanceId ?? null,
        } as BuilderRuntimeNode,
        dragNodeUid: newNodeUid,
        dragOverNodeUid,
        dragStatus: realDragStatus,
      });

      nodeData.parent = parentInstanceId;
      nodeData.mountPoint = mountPoint;
      nodeData.sort = sortIndex;

      if (nodeData.bricks) {
        // snippet
        const snippetData = {
          parentUid,
          nodeDetails: nodeData.bricks.map((brickConf) =>
            getSnippetNodeDetail({
              parent: parentInstanceId,
              parentUid: parentUid,
              mountPoint: mountPoint,
              nodeUid: newNodeUid,
              brickConf: brickConf,
              isPortalCanvas: false,
            })
          ),
          nodeIds,
          nodeUids,
        };
        if (isNeedUpdateSnippet) {
          this.snippetApply(snippetData);
        } else {
          return snippetData;
        }
      }

      this.runAddNodeAction({
        nodeUid: newNodeUid,
        parentUid,
        nodeUids,
        nodeIds,
        nodeData,
        sort: sortIndex,
      });
      const sortData = {
        nodeUids,
        nodeInstanceIds,
        nodeIds,
      };
      detail.sortData = sortData;
      this.eventTarget.dispatchEvent(
        new CustomEvent(BuilderInternalEventType.NODE_ADD, {
          detail: {
            nodeUid: newNodeUid,
            parentUid,
            nodeUids,
            nodeInstanceIds,
            nodeIds,
            nodeData,
          },
        })
      );
    }
  }

  workbenchTreeNodeMove(detail: WorkbenchTreeNodeMoveProps): void {
    const { rootId, nodes, edges, wrapperNode } = this.data;
    const { dragNodeUid, dragOverNodeUid, dragStatus } = detail;
    const nodeData = nodes.find((item) => item.$$uid === dragNodeUid);
    const originEdge = edges.find((edge) => edge.child === nodeData.$$uid);
    const originParentUid = originEdge.parent;
    const originParentNode = nodes.find(
      (node) => node.$$uid === originParentUid
    );
    const {
      parentUid,
      parnetNodeData,
      mountPoint,
      sortIndex,
      sortUids: nodeUids,
      sortNodeIds: nodeIds,
    } = this.getDragInfo({
      nodeData,
      dragNodeUid,
      dragOverNodeUid,
      dragStatus,
    });

    const newData = {
      rootId,
      nodes,
      edges: edges
        .filter((edge) => edge.child !== dragNodeUid)
        .concat({
          parent: parentUid,
          child: dragNodeUid,
          mountPoint: mountPoint,
          sort: sortIndex,
          $$isTemplateDelegated: isParentExpandableTemplate(nodes, parentUid),
        }),
      wrapperNode,
    };
    this.data = {
      ...newData,
      edges: reorderBuilderEdges(newData, {
        parentUid,
        nodeUids,
      }),
    };
    this.triggerDataChange();
    this.eventTarget.dispatchEvent(
      new CustomEvent<EventDetailOfWorkbenchTreeNodeMove>(
        BuilderInternalEventType.WORKBENCH_TREE_NODE_MOVE,
        {
          detail: {
            nodeUid: dragNodeUid,
            nodeInstanceId: nodeData.instanceId,
            nodeIds,
            ...(originParentNode.instanceId !== parnetNodeData.instanceId ||
            originEdge.mountPoint !== mountPoint
              ? {
                  nodeData: {
                    parent: parnetNodeData.instanceId,
                    mountPoint: mountPoint,
                  },
                }
              : {}),
            objectId: getObjectIdByNode(nodeData),
          },
        }
      )
    );
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.NODE_UPDATE, {
        detail: this.data,
      })
    );
  }

  /**
   * Move mount-point up or down.
   */
  moveMountPoint(
    { $$uid: parentUid }: BuilderRuntimeNode,
    mountPoint: string,
    direction: "up" | "down"
  ): void {
    const { relatedEdges, mountPoints } = getRelatedEdgesAndMountPoint(
      this.data.edges,
      parentUid
    );
    const index = mountPoints.indexOf(mountPoint);
    const orderedMountPoints = moveItemInList(mountPoints, index, direction);
    if (!orderedMountPoints) {
      return;
    }
    const orderedEdges = sortBy(
      relatedEdges,
      (edge) => orderedMountPoints.indexOf(edge.mountPoint),
      "sort"
    );
    this.reorder(parentUid, orderedEdges);
  }

  private reorder(parentUid: number, orderedEdges: BuilderRuntimeEdge[]): void {
    const { nodes } = this.data;
    const childUids = orderedEdges.map((edge) => edge.child);
    this.data = {
      ...this.data,
      edges: reorderBuilderEdges(this.data, { parentUid, nodeUids: childUids }),
    };
    this.triggerDataChange();
    const childIds = childUids
      .map((uid) => nodes.find((node) => node.$$uid === uid))
      .map((node) => node.id);
    this.eventTarget.dispatchEvent(
      new CustomEvent<EventDetailOfNodeReorder>(
        BuilderInternalEventType.NODE_REORDER,
        {
          detail: {
            nodeUids: childUids,
            parentUid,
            nodeIds: childIds,
            objectId: getObjectIdByNode(
              nodes.find((node) => node.$$uid === parentUid)
            ),
          },
        }
      )
    );
  }

  contextUpdated(detail: EventDetailOfContextUpdated): void {
    const { rootId, nodes, edges, wrapperNode } = this.data;
    this.data = {
      rootId,
      edges,
      nodes: nodes.map((node) =>
        node.$$uid === rootId ? { ...node, context: detail.context } : node
      ),
      wrapperNode,
    };
    this.triggerDataChange();
  }

  nodeReorder(detail: EventDetailOfNodeReorder): void {
    const { nodeUids, parentUid } = detail;
    this.data = {
      ...this.data,
      edges: reorderBuilderEdges(this.data, { parentUid, nodeUids }),
    };
    this.triggerDataChange();
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.NODE_REORDER, { detail })
    );
  }

  nodeDelete(detail: BuilderRuntimeNode): void {
    this.data = deleteNodeFromTree(detail.$$uid, this.data);
    this.triggerDataChange();
  }

  nodeClick(detail: BuilderRuntimeNode): void {
    this.setActiveNodeUid(detail.$$uid);
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.NODE_CLICK, { detail })
    );
  }

  contextMenuChange(detail: BuilderContextMenuStatus): void {
    this.contextMenuStatus = detail;
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.CONTEXT_MENU_CHANGE)
    );
  }

  onDataChange(fn: EventListener): () => void {
    this.eventTarget.addEventListener(BuilderInternalEventType.DATA_CHANGE, fn);
    return (): void => {
      this.eventTarget.removeEventListener(
        BuilderInternalEventType.DATA_CHANGE,
        fn
      );
    };
  }

  onNodeAdd(
    fn: (event: CustomEvent<EventDetailOfNodeAdd>) => void
  ): () => void {
    this.eventTarget.addEventListener(
      BuilderInternalEventType.NODE_ADD,
      fn as EventListener
    );
    return (): void => {
      this.eventTarget.removeEventListener(
        BuilderInternalEventType.NODE_ADD,
        fn as EventListener
      );
    };
  }

  onSnippetApply(
    fn: (event: CustomEvent<EventDetailOfSnippetApply>) => void
  ): () => void {
    this.eventTarget.addEventListener(
      BuilderInternalEventType.SNIPPET_APPLY,
      fn as EventListener
    );
    return (): void => {
      this.eventTarget.removeEventListener(
        BuilderInternalEventType.SNIPPET_APPLY,
        fn as EventListener
      );
    };
  }

  onNodeReorder(
    fn: (event: CustomEvent<EventDetailOfNodeReorder>) => void
  ): () => void {
    this.eventTarget.addEventListener(
      BuilderInternalEventType.NODE_REORDER,
      fn as EventListener
    );
    return () => {
      this.eventTarget.removeEventListener(
        BuilderInternalEventType.NODE_REORDER,
        fn as EventListener
      );
    };
  }

  onNodeMove(
    fn: (event: CustomEvent<EventDetailOfNodeMove>) => void
  ): () => void {
    this.eventTarget.addEventListener(
      BuilderInternalEventType.NODE_MOVE,
      fn as EventListener
    );
    return () => {
      this.eventTarget.removeEventListener(
        BuilderInternalEventType.NODE_MOVE,
        fn as EventListener
      );
    };
  }

  onWorkbenchTreeNodeMove(
    fn: (event: CustomEvent<EventDetailOfNodeMove>) => void
  ): () => void {
    this.eventTarget.addEventListener(
      BuilderInternalEventType.WORKBENCH_TREE_NODE_MOVE,
      fn as EventListener
    );
    return () => {
      this.eventTarget.removeEventListener(
        BuilderInternalEventType.WORKBENCH_TREE_NODE_MOVE,
        fn as EventListener
      );
    };
  }

  onNodeClick(
    fn: (event: CustomEvent<BuilderRuntimeNode>) => void
  ): () => void {
    this.eventTarget.addEventListener(
      BuilderInternalEventType.NODE_CLICK,
      fn as EventListener
    );
    return () => {
      this.eventTarget.removeEventListener(
        BuilderInternalEventType.NODE_CLICK,
        fn as EventListener
      );
    };
  }

  onNodeUpdate(
    fn: (event: CustomEvent<BuilderCanvasData>) => void
  ): () => void {
    this.eventTarget.addEventListener(
      BuilderInternalEventType.NODE_UPDATE,
      fn as EventListener
    );
    return () => {
      this.eventTarget.removeEventListener(
        BuilderInternalEventType.NODE_UPDATE,
        fn as EventListener
      );
    };
  }

  onContextMenuChange(
    fn: (event: CustomEvent<BuilderContextMenuStatus>) => void
  ): () => void {
    this.eventTarget.addEventListener(
      BuilderInternalEventType.CONTEXT_MENU_CHANGE,
      fn as EventListener
    );
    return () => {
      this.eventTarget.removeEventListener(
        BuilderInternalEventType.CONTEXT_MENU_CHANGE,
        fn as EventListener
      );
    };
  }

  setShowRelatedNodesBasedOnEvents(show: boolean): void {
    this.showRelatedNodesBasedOnEvents = show;
    this.eventTarget.dispatchEvent(
      new CustomEvent(
        BuilderInternalEventType.SHOW_RELATED_NODES_BASED_ON_EVENTS
      )
    );
  }

  getShowRelatedNodesBasedOnEvents(): boolean {
    return this.showRelatedNodesBasedOnEvents;
  }

  onShowRelatedNodesBasedOnEventsChange(fn: EventListener): () => void {
    this.eventTarget.addEventListener(
      BuilderInternalEventType.SHOW_RELATED_NODES_BASED_ON_EVENTS,
      fn
    );
    return (): void => {
      this.eventTarget.removeEventListener(
        BuilderInternalEventType.SHOW_RELATED_NODES_BASED_ON_EVENTS,
        fn
      );
    };
  }

  setHoverNodeUid(uid: number): void {
    if (this.hoverNodeUid !== uid) {
      this.hoverNodeUid = uid;
      this.eventTarget.dispatchEvent(
        new CustomEvent(BuilderInternalEventType.HOVER_NODE_CHANGE)
      );
    }
  }

  getHoverNodeUid(): number {
    return this.hoverNodeUid;
  }

  onHoverNodeChange(fn: EventListener): () => void {
    this.eventTarget.addEventListener(
      BuilderInternalEventType.HOVER_NODE_CHANGE,
      fn
    );
    return (): void => {
      this.eventTarget.removeEventListener(
        BuilderInternalEventType.HOVER_NODE_CHANGE,
        fn
      );
    };
  }

  setActiveNodeUid(uid: number): void {
    if (this.activeNodeUid !== uid) {
      this.activeNodeUid = uid;
      this.eventTarget.dispatchEvent(
        new CustomEvent(BuilderInternalEventType.ACTIVE_NODE_CHANGE)
      );
    }
  }

  getActiveNodeUid(): number {
    return this.activeNodeUid;
  }

  onActiveNodeChange(fn: EventListener): () => void {
    this.eventTarget.addEventListener(
      BuilderInternalEventType.ACTIVE_NODE_CHANGE,
      fn
    );
    return (): void => {
      this.eventTarget.removeEventListener(
        BuilderInternalEventType.ACTIVE_NODE_CHANGE,
        fn
      );
    };
  }

  toggleOutline(nodeInstanceId: string): void {
    if (this.outlineDisabledNodes.has(nodeInstanceId)) {
      this.outlineDisabledNodes.delete(nodeInstanceId);
    } else {
      this.outlineDisabledNodes.add(nodeInstanceId);
    }
    this.localJsonStorage.setItem(
      storageKeyOfOutlineDisabledNodes,
      Array.from(this.outlineDisabledNodes)
    );
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.OUTLINE_DISABLED_NODES_CHANGE)
    );
  }

  isOutlineEnabled(nodeInstanceId: string): boolean {
    return !this.outlineDisabledNodes.has(nodeInstanceId);
  }

  onOutlineEnabledNodesChange(fn: EventListener): () => void {
    this.eventTarget.addEventListener(
      BuilderInternalEventType.OUTLINE_DISABLED_NODES_CHANGE,
      fn
    );
    return (): void => {
      this.eventTarget.removeEventListener(
        BuilderInternalEventType.OUTLINE_DISABLED_NODES_CHANGE,
        fn
      );
    };
  }

  setHighlightNodes(nodeUids: Set<number>): void {
    this.highlightNodes = nodeUids;
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.HIGHLIGHT_NODES_CHANGE)
    );
  }

  getHighlightNodes(): Set<number> {
    return this.highlightNodes;
  }

  onHighlightNodesChange(fn: EventListener): () => void {
    this.eventTarget.addEventListener(
      BuilderInternalEventType.HIGHLIGHT_NODES_CHANGE,
      fn
    );
    return (): void => {
      this.eventTarget.removeEventListener(
        BuilderInternalEventType.HIGHLIGHT_NODES_CHANGE,
        fn
      );
    };
  }

  updateDroppingStatus(
    nodeUid: number,
    mountPoint: string,
    isDraggingOver: boolean
  ): void {
    const nodeStatus = this.droppingStatus.get(nodeUid);
    this.droppingStatus = new Map(
      Array.from(this.droppingStatus.entries()).concat([
        [
          nodeUid,
          new Map(
            (nodeStatus ? Array.from(nodeStatus) : []).concat([
              [mountPoint, isDraggingOver],
            ])
          ),
        ],
      ])
    );
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.DROPPING_STATUS_CHANGE)
    );

    // When dragging nodes over `EditorContainer`, the `mouseout` events
    // are not triggered, which causes hover status does not get cleared.
    // So we manually reset hover status once dragging starts.
    if (
      this.hoverNodeUid &&
      Array.from(this.droppingStatus.values())
        .flatMap((nodeStatus) => Array.from(nodeStatus.values()))
        .some(Boolean)
    ) {
      this.setHoverNodeUid(undefined);
    }
  }

  getDroppingStatus(): BuilderDroppingStatus {
    return this.droppingStatus;
  }

  onDroppingStatusChange(fn: EventListener): () => void {
    this.eventTarget.addEventListener(
      BuilderInternalEventType.DROPPING_STATUS_CHANGE,
      fn
    );
    return (): void => {
      this.eventTarget.removeEventListener(
        BuilderInternalEventType.DROPPING_STATUS_CHANGE,
        fn
      );
    };
  }
}

function getRelatedEdgesAndMountPoint(
  edges: BuilderRuntimeEdge[],
  parentUid: number
): {
  /** Edges of the same parent */
  relatedEdges: BuilderRuntimeEdge[];
  /** Mount-point of the same parent */
  mountPoints: string[];
} {
  const relatedEdges = sortBy(
    edges.filter(
      (edge) => edge.parent === parentUid && !edge.$$isTemplateExpanded
    ),
    "sort"
  );
  const mountPointSet = new Set<string>();
  for (const edge of relatedEdges) {
    mountPointSet.add(edge.mountPoint);
  }
  const mountPoints = Array.from(mountPointSet);
  return { relatedEdges, mountPoints };
}

function moveItemInList<T>(
  list: T[],
  index: number,
  direction: "up" | "down"
): T[] | undefined {
  let upperIndex: number;
  if (direction === "up") {
    if (index <= 0) {
      return;
    }
    upperIndex = index - 1;
  } else {
    if (index === -1 || index >= list.length - 1) {
      return;
    }
    upperIndex = index;
  }
  return [
    ...list.slice(0, upperIndex),
    list[upperIndex + 1],
    list[upperIndex],
    ...list.slice(upperIndex + 2),
  ];
}
