import { omit } from "lodash";
import EventTarget from "@ungap/event-target";
import {
  BuilderRouteOrBrickNode,
  BuilderRouteNode,
  Story,
  BuilderCustomTemplateNode,
} from "@next-core/brick-types";
import { JsonStorage } from "@next-core/brick-utils";
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

enum BuilderInternalEventType {
  NODE_ADD = "builder.node.add",
  NODE_MOVE = "builder.node.move",
  NODE_REORDER = "builder.node.reorder",
  NODE_CLICK = "builder.node.click",
  SNIPPET_APPLY = "builder.snippet.apply",
  CONTEXT_MENU_CHANGE = "builder.contextMenu.change",
  DATA_CHANGE = "builder.data.change",
  SHARED_EDITOR_LIST_CHANGE = "builder.sharedEditorList.change",
  ROUTE_LIST_CHANGE = "builder.routeList.change",
  HOVER_NODE_CHANGE = "builder.hoverNode.change",
  SHOW_RELATED_NODES_BASED_ON_EVENTS = "builder.showRelatedNodesBasedOnEvents.change",
  HIGHLIGHT_NODES_CHANGE = "builder.highlightNodes.change",
  OUTLINE_DISABLED_NODES_CHANGE = "builder.outlineDisabledNodes.change",
  DROPPING_STATUS_CHANGE = "builder.droppingStatus.change",
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
      new CustomEvent(BuilderInternalEventType.DATA_CHANGE)
    );
  }

  runAddNodeAction = (detail: EventDetailOfNodeAdd): void => {
    const { rootId, nodes, edges, wrapperNode } = this.data;
    const { nodeUid, parentUid, nodeUids, nodeData } = detail;

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
        sort: undefined,
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
  };

  updateBrick(detail: EventDetailOfNodeAdd): void {
    this.data = deleteNodeFromTree(detail.nodeUid, this.data);

    this.runAddNodeAction(detail);
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
