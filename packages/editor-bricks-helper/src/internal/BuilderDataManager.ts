import { omit, sortBy } from "lodash";
import EventTarget from "@ungap/event-target";
import {
  BuilderRouteOrBrickNode,
  BuilderRouteNode,
} from "@next-core/brick-types";
import {
  AbstractBuilderDataManager,
  BuilderCanvasData,
  BuilderContextMenuStatus,
  BuilderRuntimeEdge,
  BuilderRuntimeNode,
  EventDetailOfNodeAdd,
  EventDetailOfNodeAddStored,
  EventDetailOfNodeMove,
  EventDetailOfNodeReorder,
  EventDetailOfContextUpdated,
} from "../interfaces";
import { getBuilderNode } from "./getBuilderNode";
import { getUniqueNodeId } from "./getUniqueNodeId";
import { reorderBuilderEdges } from "./reorderBuilderEdges";
import { deleteNodeFromTree } from "./deleteNodeFromTree";

enum BuilderInternalEventType {
  NODE_ADD = "builder.node.add",
  NODE_MOVE = "builder.node.move",
  NODE_REORDER = "builder.node.reorder",
  NODE_CLICK = "builder.node.click",
  CONTEXT_MENU_CHANGE = "builder.contextMenu.change",
  DATA_CHANGE = "builder.data.change",
  ROUTE_LIST_CHANGE = "builder.route.list.change",
}

export class BuilderDataManager implements AbstractBuilderDataManager {
  private data: BuilderCanvasData = {
    rootId: null,
    nodes: [],
    edges: [],
  };

  private routeList: BuilderRouteNode[] = [];

  private eventTarget = new EventTarget();

  private contextMenuStatus: BuilderContextMenuStatus = {
    active: false,
  };

  getData(): BuilderCanvasData {
    return this.data;
  }

  getContextMenuStatus(): BuilderContextMenuStatus {
    return this.contextMenuStatus;
  }

  routeListInit(data: BuilderRouteNode[]): void {
    this.routeList = data;
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.ROUTE_LIST_CHANGE)
    );
  }

  getRouteList(): BuilderRouteNode[] {
    return this.routeList;
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

  dataInit(root: BuilderRuntimeNode): void {
    const nodes: BuilderRuntimeNode[] = [];
    const edges: BuilderRuntimeEdge[] = [];
    const walk = (node: BuilderRouteOrBrickNode): number => {
      const currentUid = getUniqueNodeId();
      nodes.push(getBuilderNode(node, currentUid));

      // For routes and custom-templates, their children are fixed
      // and mount points should be ignored. To unify tree edge
      // data structure, just override their mount points.
      let overrideChildrenMountPoint: string;
      switch (node.type) {
        case "bricks":
        case "custom-template":
          overrideChildrenMountPoint = "bricks";
          break;
        case "routes":
          overrideChildrenMountPoint = "routes";
          break;
      }

      if (Array.isArray(node.children)) {
        const sortedChildren = sortBy(node.children, [
          (item) => item.sort ?? -Infinity,
        ]);
        sortedChildren.forEach((child, index) => {
          const childUid = walk(child);
          edges.push({
            child: childUid,
            parent: currentUid,
            mountPoint: overrideChildrenMountPoint ?? child.mountPoint,
            sort: index,
          });
        });
      }
      return currentUid;
    };
    const rootId = walk(root);
    this.data = {
      rootId,
      nodes,
      edges,
    };
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.DATA_CHANGE)
    );
  }

  nodeAdd(detail: EventDetailOfNodeAdd): void {
    const { rootId, nodes, edges } = this.data;
    const { nodeUid, parentUid, nodeUids, nodeAlias, nodeData } = detail;
    this.data = {
      rootId,
      nodes: nodes.concat(
        getBuilderNode(
          (omit(nodeData, [
            "parent",
          ]) as Partial<BuilderRouteOrBrickNode>) as BuilderRouteOrBrickNode,
          nodeUid,
          nodeAlias
        )
      ),
      edges: reorderBuilderEdges(
        edges.concat({
          parent: parentUid,
          child: nodeUid,
          mountPoint: nodeData.mountPoint,
          sort: undefined,
        }),
        parentUid,
        nodeUids
      ),
    };
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.DATA_CHANGE)
    );
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.NODE_ADD, { detail })
    );
  }

  nodeAddStored(detail: EventDetailOfNodeAddStored): void {
    const { rootId, nodes, edges } = this.data;
    const { nodeUid, nodeAlias, nodeData } = detail;
    this.data = {
      rootId,
      nodes: nodes.map((node) =>
        node.$$uid === nodeUid
          ? getBuilderNode(nodeData, nodeUid, nodeAlias)
          : node
      ),
      edges,
    };
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.DATA_CHANGE)
    );
  }

  nodeMove(detail: EventDetailOfNodeMove): void {
    const { rootId, nodes, edges } = this.data;
    const { nodeUid, parentUid, nodeUids, nodeData } = detail;
    this.data = {
      rootId,
      nodes,
      edges: reorderBuilderEdges(
        edges
          .filter((edge) => edge.child !== nodeUid)
          .concat({
            parent: parentUid,
            child: nodeUid,
            mountPoint: nodeData.mountPoint,
            sort: undefined,
          }),
        parentUid,
        nodeUids
      ),
    };
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.DATA_CHANGE)
    );
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.NODE_MOVE, { detail })
    );
  }

  contextUpdated(detail: EventDetailOfContextUpdated): void {
    const { rootId, nodes, edges } = this.data;
    this.data = {
      rootId,
      edges,
      nodes: nodes.map((node) =>
        node.$$uid === rootId ? { ...node, context: detail.context } : node
      ),
    };
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.DATA_CHANGE)
    );
  }

  nodeReorder(detail: EventDetailOfNodeReorder): void {
    const { rootId, nodes, edges } = this.data;
    const { nodeUids, parentUid } = detail;
    this.data = {
      rootId,
      nodes,
      edges: reorderBuilderEdges(edges, parentUid, nodeUids),
    };
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.DATA_CHANGE)
    );
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.NODE_REORDER, { detail })
    );
  }

  nodeDelete(detail: BuilderRuntimeNode): void {
    this.data = deleteNodeFromTree(detail.$$uid, this.data);
    this.eventTarget.dispatchEvent(
      new CustomEvent(BuilderInternalEventType.DATA_CHANGE)
    );
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
}
