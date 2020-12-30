import { BuilderRouteOrBrickNode } from "@easyops/brick-types";

export interface BuilderCanvasData {
  rootId: number;
  nodes: BuilderRuntimeNode[];
  edges: BuilderRuntimeEdge[];
}

export type BuilderRuntimeNode = BuilderRouteOrBrickNode & {
  $$uid?: number;
};

export interface BuilderRuntimeEdge {
  child: number;
  parent: number;
  mountPoint: string;
  sort: number;
}

export interface BuilderGroupedChildNode {
  mountPoint: string;
  childNodes: BuilderRuntimeNode[];
}

export enum BuilderEventType {
  DATA_INIT = "builder.data.init",
  DATA_UPDATE = "builder.data.update",
  NODE_ADD = "builder.node.add",
  NODE_ADD_STORED = "builder.node.add.stored",
  NODE_MOVE = "builder.node.move",
  NODE_MOVE_STORED = "builder.node.move.stored",
  NODE_REORDER = "builder.node.reorder",
  NODE_DRAG_START = "builder.node.drag.start",
}

export interface EventDetailOfNodeAdd {
  nodeUid: number;
  parentUid: number;
  nodeUids: number[];
  nodeIds: string[];
  nodeAlias: string;
  nodeData: NodeInstance;
}

export interface NodeInstance {
  parent: string;
  type: "brick";
  brick: string;
  mountPoint: string;
}

export interface EventDetailOfNodeAddStored {
  nodeUid: number;
  nodeData: BuilderRouteOrBrickNode;
  nodeAlias: string;
}

export type EventDetailOfNodeMove = Omit<
  EventDetailOfNodeAdd,
  "nodeAlias" | "nodeData"
> & {
  nodeInstanceId: string;
  nodeData: {
    parent: string;
    mountPoint: string;
  };
};

export interface EventDetailOfNodeReorder {
  nodeUids: number[];
  parentUid: number;
  mountPoint: string;
  nodeIds: string[];
}

export interface EventDetailOfNodeDragStart {
  nodeUid: number;
}

export enum BuilderDataTransferType {
  NODE_TO_ADD = "text/node-to-add",
  NODE_TO_MOVE = "text/node-to-move",
}

export interface BuilderDataTransferPayloadOfNodeToAdd {
  brick: string;
}

export interface BuilderDataTransferPayloadOfNodeToMove {
  nodeUid: number;
  nodeInstanceId: string;
  nodeId: string;
}

export enum EditorBrickType {
  DEFAULT = "editorOfDefault",
  CONTAINER = "editorOfContainer",
  TRANSPARENT_CONTAINER = "editorOfTransparentContainer",
}

export enum EditorSelfLayout {
  BLOCK = "block",
  INLINE = "inline",
  CONTAINER = "container",
}

export enum EditorSlotContentLayout {
  BLOCK = "block",
  INLINE = "inline",
  GRID = "grid",
}
