import {
  BrickEventsMap,
  BuilderRouteOrBrickNode,
  CustomTemplateProxy,
  ContextConf,
} from "@next-core/brick-types";

export interface BuilderCanvasData {
  rootId: number;
  nodes: BuilderRuntimeNode[];
  edges: BuilderRuntimeEdge[];
}

export type BuilderRuntimeNode<
  P = Record<string, unknown>
> = BuilderRouteOrBrickNode & {
  $$uid?: number;
  $$parsedProperties?: P;
  $$parsedEvents?: BrickEventsMap;
  $$parsedProxy?: CustomTemplateProxy;
  $$matchedSelectors?: string[];
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

export interface EventDetailOfNodeAdd {
  nodeUid: number;
  parentUid: number;
  nodeUids: number[];
  nodeIds: string[];
  nodeAlias: string;
  nodeData: NodeInstance;
}

export interface EventDetailOfContextUpdated {
  context: ContextConf[];
}

export interface NodeInstance {
  parent: string;
  type: "brick" | "provider" | "template";
  brick: string;
  mountPoint: string;
  bg?: boolean;
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
  nodeIds: string[];
}

export interface EventDetailOfNodeDragStart {
  nodeUid: number;
}

export interface BuilderContextMenuStatus {
  active: boolean;
  node?: BuilderRuntimeNode;
  /** `x` is relative to the viewport. */
  x?: number;
  /** `y` is relative to the viewport. */
  y?: number;
}

export enum BuilderDataTransferType {
  NODE_TO_ADD = "builder/node-to-add",
  NODE_TO_MOVE = "builder/node-to-move",
}

export interface BuilderDataTransferPayloadOfNodeToAdd {
  brickType?: "brick" | "provider" | "template";
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

export interface AbstractBuilderDataManager {
  getData(): BuilderCanvasData;
  getContextMenuStatus(): BuilderContextMenuStatus;
  dataInit(root: BuilderRuntimeNode): void;
  nodeAdd(detail: EventDetailOfNodeAdd): void;
  nodeAddStored(detail: EventDetailOfNodeAddStored): void;
  nodeMove(detail: EventDetailOfNodeMove): void;
  nodeReorder(detail: EventDetailOfNodeReorder): void;
  nodeDelete(detail: BuilderRuntimeNode): void;
  nodeClick(detail: BuilderRuntimeNode): void;
  contextUpdated(detail: EventDetailOfContextUpdated): void;
  onDataChange(fn: EventListener): () => void;
  onNodeAdd(fn: (event: CustomEvent<EventDetailOfNodeAdd>) => void): () => void;
  onNodeReorder(
    fn: (event: CustomEvent<EventDetailOfNodeReorder>) => void
  ): () => void;
  onNodeMove(
    fn: (event: CustomEvent<EventDetailOfNodeMove>) => void
  ): () => void;
  onNodeClick(fn: (event: CustomEvent<BuilderRuntimeNode>) => void): () => void;
  onContextMenuChange(
    fn: (event: CustomEvent<BuilderContextMenuStatus>) => void
  ): () => void;
}
