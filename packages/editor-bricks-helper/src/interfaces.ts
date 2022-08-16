import {
  BrickEventsMap,
  BuilderRouteOrBrickNode,
  CustomTemplateProxy,
  ContextConf,
  BuilderRouteNode,
  BrickLifeCycle,
  BrickConf,
  RouteConf,
} from "@next-core/brick-types";

export interface BuilderCanvasData {
  rootId: number;
  nodes: BuilderRuntimeNode[];
  edges: BuilderRuntimeEdge[];
  wrapperNode?: BuilderRuntimeNode;
}

export interface BuilderCanvasSettings {
  mode: "page" | "dialog";
}

export type BuilderRuntimeNode<P = Record<string, unknown>> =
  BuilderRouteOrBrickNode & {
    $$uid?: number;
    $$parsedProperties?: P;
    $$parsedEvents?: BrickEventsMap;
    $$parsedLifeCycle?: BrickLifeCycle;
    $$matchedSelectors?: string[];
    $$isTemplateInternalNode?: boolean;
    $$isExpandableTemplate?: boolean;
    $$templateProxy?: CustomTemplateProxy;
    $$templateRefToUid?: Map<string, number>;
    $$delegatedSlots?: Map<string, TemplateDelegatedContext[]>;
    $$normalized?: BrickConf | RouteConf | null;
  };

export interface BuilderRuntimeEdge {
  child: number;
  parent: number;
  mountPoint: string;
  sort: number;
  $$isTemplateInternal?: boolean;
  $$isTemplateDelegated?: boolean;
  $$isTemplateExpanded?: boolean;
}

export interface TemplateDelegatedContext {
  templateUid: number;
  templateMountPoint: string;
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
  nodeData: NodeInstance;
  sort?: number;
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

export type EventDetailOfNodeMove = Omit<EventDetailOfNodeAdd, "nodeData"> & {
  nodeInstanceId: string;
  nodeData: {
    parent: string;
    mountPoint: string;
  };
};

export type EventDetailOfWorkbenchTreeNodeMove = {
  nodeUid: number;
  nodeInstanceId: string;
  nodeIds: string[];
  objectId: string;
  nodeData?: {
    parent: string;
    mountPoint: string;
  };
};

export type dragStatus = "inside" | "top" | "bottom";

export interface WorkbenchNodeData extends NodeInstance {
  instanceId: string;
  id: string;
}
export interface WorkbenchNodeAdd {
  nodeData: WorkbenchNodeData & {
    bricks: BrickConf[];
    $$uid?: number;
  };
  mountPoint: string;
  dragOverInstanceId: string;
  /**
   * @deprecated 请使用 parent。
   * @internal
   */
  parentInstanceId?: string;
  parent: string;
  dragStatus: dragStatus;
}
export interface WorkbenchTreeNodeMoveProps {
  dragNodeUid: number;
  dragOverNodeUid: number;
  dragParentNodeUid: number;
  dragStatus: "inside" | "top" | "bottom";
}

export interface EventDetailOfNodeReorder {
  nodeUids: number[];
  parentUid: number;
  nodeIds: string[];
  objectId?: string;
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

export interface SharedEditorConf {
  id: string;
  editor: string;
  editorProps?: Record<string, unknown>;
}

export type BuilderDroppingStatus = Map<number, Map<string, boolean>>;
