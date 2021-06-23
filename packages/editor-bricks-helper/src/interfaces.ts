import {
  BrickEventsMap,
  BuilderRouteOrBrickNode,
  CustomTemplateProxy,
  ContextConf,
  BuilderRouteNode,
  BrickLifeCycle,
  BrickConf,
} from "@next-core/brick-types";

export interface BuilderCanvasData {
  rootId: number;
  nodes: BuilderRuntimeNode[];
  edges: BuilderRuntimeEdge[];
}

export interface BuilderCanvasSettings {
  mode: "page" | "dialog";
}

export type BuilderRuntimeNode<P = Record<string, unknown>> =
  BuilderRouteOrBrickNode & {
    $$uid?: number;
    $$parsedProperties?: P;
    $$parsedEvents?: BrickEventsMap;
    $$parsedProxy?: CustomTemplateProxy;
    $$parsedLifeCycle?: BrickLifeCycle;
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
  portal?: boolean;
  properties?: string;
  events?: string;
  lifeCycle?: string;
  sort?: number;
}

export interface EventDetailOfNodeAddStored {
  nodeUid: number;
  nodeData: BuilderRouteOrBrickNode;
  nodeAlias: string;
}

export interface EventDetailOfSnippetApply {
  parentUid: number;
  /** First level node only. */
  nodeUids: number[];
  /** First level node only. */
  nodeIds: string[];
  nodeDetails: SnippetNodeDetail[];
}

export interface SnippetNodeDetail {
  nodeUid: number;
  nodeAlias: string;
  parentUid: number;
  nodeData: SnippetNodeInstance;
  children: SnippetNodeDetail[];
}

export type SnippetNodeInstance = Omit<NodeInstance, "parent"> & {
  parent?: string;
};

export interface EventDetailOfSnippetApplyStored {
  flattenNodeDetails: EventDetailOfNodeAddStored[];
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
  SNIPPET_TO_APPLY = "builder/snippet-to-apply",
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

export interface BuilderDataTransferPayloadOfSnippetToApply {
  bricks: BrickConf[];
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
  getRouteList(): BuilderRouteNode[];
  getContextMenuStatus(): BuilderContextMenuStatus;
  dataInit(root: BuilderRuntimeNode): void;
  routeListInit(data: BuilderRouteNode[]): void;
  nodeAdd(detail: EventDetailOfNodeAdd): void;
  nodeAddStored(detail: EventDetailOfNodeAddStored): void;
  snippetApply(detail: EventDetailOfSnippetApply): void;
  snippetApplyStored(detail: EventDetailOfSnippetApplyStored): void;
  nodeMove(detail: EventDetailOfNodeMove): void;
  nodeReorder(detail: EventDetailOfNodeReorder): void;
  nodeDelete(detail: BuilderRuntimeNode): void;
  nodeClick(detail: BuilderRuntimeNode): void;
  contextUpdated(detail: EventDetailOfContextUpdated): void;
  onDataChange(fn: EventListener): () => void;
  onRouteListChange(fn: EventListener): () => void;
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
