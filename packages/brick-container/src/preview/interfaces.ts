import type { Storyboard } from "@next-core/types";
import type { pipes } from "@next-core/pipes";

export interface PreviewHelperBrick {
  start(previewFromOrigin: string, options: unknown): void;
}

export interface Position {
  x: number;
  y: number;
}
export interface PreviewBaseMessage {
  sender: "builder" | "preview-container" | "previewer";
  type: string;
  forwardedFor?: "builder" | "previewer";
}

export interface PreviewMessageBuilderHoverOnIframe
  extends PreviewBaseMessage,
    HighlightBaseInfo {
  sender: "builder";
  type: "hover-on-iframe";
}

export interface PreviewMessageBuilderHoverOnMain
  extends PreviewBaseMessage,
    HighlightBaseInfo {
  sender: "builder";
  type: "hover-on-main";
}

export interface HighLightNode {
  iid: string;
  alias: string;
}

export interface PreviewMessageBuilderHoverOnContext
  extends PreviewBaseMessage,
    HighlightBaseInfo {
  sender: "builder";
  type: "hover-on-context";
  highlightNodes: HighLightNode[];
}

export interface PreviewMessageBuilderHoverOnBrick
  extends PreviewBaseMessage,
    HighlightBaseInfo {
  sender: "builder";
  type: "hover-on-brick";
}

export interface PreviewMessageBuilderSelectBrick
  extends PreviewBaseMessage,
    HighlightBaseInfo {
  sender: "builder";
  type: "select-brick";
}

export interface PreviewMessageBuilderDrop extends PreviewBaseMessage {
  sender: "previewer";
  type: "previewer-drop";
  nodeData: Record<string, any>;
}

export interface HighlightBaseInfo {
  iid: string;
  alias: string;
}

export interface ExcuteProxyMethodResult {
  method: string;
  res: any;
}

export interface PreviewDataOption {
  dataType: "state" | "context";
}

export type PreviewMessageFromPreviewer =
  | PreviewMessagePreviewerHoverOnMain
  | PreviewMessagePreviewerHoverOnBrick
  | PreviewMessagePreviewerSelectBrick
  | PreviewMessagePreviewerHighlightBrick
  | PreviewMessagePreviewerHighlightContext
  | PreviewMessagePreviewerContextMenuOnBrick
  | PreviewMessagePreviewerPreviewStarted
  | PreviewMessagePreviewerUrlChange
  | PreviewMessagePreviewerRouteMatchChange
  | PreviewMessagePreviewerScroll
  | PreviewMessagePreviewerCaptureOk
  | PreviewMessagePreviewerCaptureFailed
  | PreviewMessagePreviewDataValueSuccess
  | PreviewMessagePreviewDataValueError;

export type PreviewMessageToPreviewer =
  | PreviewMessageContainerBuilderHoverOnIframe
  | PreviewMessageContainerBuilderHoverOnMain
  | PreviewMessageContainerBuilderHoverOnBrick
  | PreviewMessageContainerBuilderHoverOnContext
  | PreviewMessageContainerBuilderSelectBrick
  | PreviewMessageContainerToggleInspecting
  | PreviewMessageContainerBack
  | PreviewMessageContainerForward
  | PreviewMessageContainerRefresh
  | PreviewMessageContainerReload
  | PreviewMessageContainerCapture
  | PreviewMessageContainerUpdatePreviewUrl
  | PreviewMessageContainerUpdatePreviewRoute
  | PreviewMessageContainerInspectDataValue;

export type PreviewMessageFromContainer =
  | PreviewMessageContainerBuilderHoverOnIframe
  | PreviewMessageContainerBuilderHoverOnMain
  | PreviewMessageContainerBuilderHoverOnBrick
  | PreviewMessageContainerBuilderHoverOnContext
  | PreviewMessageContainerPreviewerHoverOnBrick
  | PreviewMessageContainerPreviewerSelectBrick
  | PreviewMessageContainerPreviewerContextMenuOnBrick
  | PreviewMessageContainerRefresh
  | PreviewMessageContainerReload
  | PreviewMessageContainerResize
  | PreviewMessageContainerCapture;

export type PreviewMessageToContainer =
  | PreviewMessageBuilderHoverOnIframe
  | PreviewMessageBuilderHoverOnBrick
  | PreviewMessageBuilderSelectBrick
  | PreviewMessageBuilderDrop
  | PreviewMessageBuilderHoverOnMain
  | PreviewMessageBuilderHoverOnContext
  | PreviewMessagePreviewerHoverOnMain
  | PreviewMessagePreviewerHoverOnBrick
  | PreviewMessagePreviewerSelectBrick
  | PreviewMessagePreviewerHighlightBrick
  | PreviewMessagePreviewerHighlightContext
  | PreviewMessagePreviewerContextMenuOnBrick
  | PreviewMessagePreviewerPreviewStarted
  | PreviewMessagePreviewerUrlChange
  | PreviewMessagePreviewerRouteMatchChange
  | PreviewMessagePreviewerScroll
  | PreviewMessagePreviewerCaptureOk
  | PreviewMessagePreviewerCaptureFailed
  | PreviewMessageContainerMatchApiCache
  | PreviewMessagePreviewDataValueSuccess
  | PreviewMessagePreviewDataValueError;

export type PreviewerMessageToBuilder =
  | PreviewMessageContainerPreviewerHoverOnMain
  | PreviewMessageContainerPreviewerHoverOnBrick
  | PreviewMessageContainerPreviewerSelectBrick
  | PreviewMessageContainerPreviewerContextMenuOnBrick
  | PreviewMessageContainerResize;

export interface PreviewMessagePreviewerPreviewStarted
  extends PreviewBaseMessage {
  sender: "previewer";
  type: "preview-started";
}

export interface PreviewMessagePreviewerHoverOnMain extends PreviewBaseMessage {
  sender: "previewer";
  type: "hover-on-main";
  isDirection?: boolean;
  position?: Position;
}
export interface PreviewMessagePreviewerHoverOnBrick
  extends PreviewBaseMessage {
  sender: "previewer";
  type: "hover-on-brick";
  iidList: string[];
  isDirection?: boolean;
  position?: Position;
}

export interface PreviewMessagePreviewerSelectBrick extends PreviewBaseMessage {
  sender: "previewer";
  type: "select-brick";
  iidList: string[];
  isDirection: boolean;
  position: Position;
}

export interface PreviewMessagePreviewerHighlightBrick
  extends PreviewBaseMessage,
    HighlightBaseInfo {
  sender: "previewer";
  type: "highlight-brick";
  highlightType: "active" | "hover";
  outlines: BrickOutline[];
}

export interface PreviewMessagePreviewerHighlightContext
  extends PreviewBaseMessage {
  sender: "previewer";
  type: "highlight-context";
  outlines: BrickOutline[];
}

export interface PreviewMessagePreviewerContextMenuOnBrick
  extends PreviewBaseMessage {
  sender: "previewer";
  type: "context-menu-on-brick";
  iidList: string[];
  position: {
    x: number;
    y: number;
  };
}

export interface PreviewMessagePreviewerUrlChange extends PreviewBaseMessage {
  sender: "previewer";
  type: "url-change";
  url: string;
}

export interface PreviewMessagePreviewerRouteMatchChange
  extends PreviewBaseMessage {
  sender: "previewer";
  type: "route-match-change";
  match: boolean;
}

export interface PreviewMessagePreviewerScroll extends PreviewBaseMessage {
  sender: "previewer";
  type: "scroll";
  scroll: {
    x: number;
    y: number;
  };
}

export interface PreviewMessagePreviewerCaptureOk extends PreviewBaseMessage {
  sender: "previewer";
  type: "capture-ok";
  screenshot: Blob;
}

export interface PreviewMessagePreviewerCaptureFailed
  extends PreviewBaseMessage {
  sender: "previewer";
  type: "capture-failed";
}

export interface PreviewMessagePreviewDataValueSuccess
  extends PreviewBaseMessage {
  sender: "previewer";
  type: "inspect-single-data-value-success" | "inspect-all-data-values-success";
  data: unknown;
}

export interface PreviewMessagePreviewDataValueError
  extends PreviewBaseMessage {
  sender: "previewer";
  type: "inspect-data-value-error";
  data: unknown;
}

export interface PreviewMessageContainerStartPreview
  extends PreviewBaseMessage {
  sender: "preview-container";
  type: "start-preview";
  options: PreviewStartOptions;
}

export interface PreviewMessageContainerToggleInspecting
  extends PreviewBaseMessage {
  sender: "preview-container";
  type: "toggle-inspecting";
  enabled: boolean;
}

export interface PreviewMessageContainerBack extends PreviewBaseMessage {
  sender: "preview-container";
  type: "back";
}

export interface PreviewMessageContainerForward extends PreviewBaseMessage {
  sender: "preview-container";
  type: "forward";
}

export interface PreviewMessageContainerRefresh extends PreviewBaseMessage {
  sender: "preview-container";
  type: "refresh";
  storyboardPatch: Partial<Storyboard>;
  settings?: PreviewSettings;
  options?: PreviewStartOptions;
}

export interface PreviewMessageContainerReload extends PreviewBaseMessage {
  sender: "preview-container";
  type: "reload";
}

export interface PreviewMessageContainerResize extends PreviewBaseMessage {
  sender: "preview-container";
  type: "resize";
}

export interface PreviewMessageContainerCapture extends PreviewBaseMessage {
  sender: "preview-container";
  type: "capture";
  maxWidth: number;
  maxHeight: number;
}

export interface PreviewMessageContainerBuilderHoverOnIframe
  extends Omit<PreviewMessageBuilderHoverOnIframe, "sender"> {
  sender: "preview-container";
  forwardedFor: "builder";
  position: Position;
}
export interface PreviewMessageContainerUpdatePreviewUrl
  extends PreviewBaseMessage {
  sender: "preview-container";
  type: "update-preview-url";
  previewUrl: string;
}

export interface PreviewMessageContainerUpdatePreviewRoute
  extends PreviewBaseMessage {
  sender: "preview-container";
  type: "update-preview-route";
  routePath: string;
  routeExact: boolean;
}

export interface PreviewMessageContainerInspectDataValue
  extends PreviewBaseMessage {
  sender: "preview-container";
  type: "inspect-data-value";
  name: string;
  option: PreviewDataOption;
}

export interface PreviewMessageContainerMatchApiCache
  extends PreviewBaseMessage {
  sender: "previewer";
  type: "match-api-cache";
  num: number;
}

export interface PreviewMessageContainerBuilderHoverOnMain
  extends Omit<PreviewMessageBuilderHoverOnMain, "sender"> {
  sender: "preview-container";
  forwardedFor: "builder";
}

export interface PreviewMessageContainerBuilderHoverOnBrick
  extends Omit<PreviewMessageBuilderHoverOnBrick, "sender"> {
  sender: "preview-container";
  forwardedFor: "builder";
}

export interface PreviewMessageContainerBuilderHoverOnContext
  extends Omit<PreviewMessageBuilderHoverOnContext, "sender"> {
  sender: "preview-container";
  forwardedFor: "builder";
}

export interface PreviewMessageContainerBuilderSelectBrick
  extends Omit<PreviewMessageBuilderSelectBrick, "sender"> {
  sender: "preview-container";
  forwardedFor: "builder";
}

export interface PreviewMessageContainerPreviewerHoverOnMain
  extends Omit<PreviewMessagePreviewerHoverOnMain, "sender"> {
  sender: "preview-container";
  forwardedFor: "previewer";
}
export interface PreviewMessageContainerPreviewerHoverOnBrick
  extends Omit<PreviewMessagePreviewerHoverOnBrick, "sender"> {
  sender: "preview-container";
  forwardedFor: "previewer";
}

export interface PreviewMessageContainerPreviewerSelectBrick
  extends Omit<PreviewMessagePreviewerSelectBrick, "sender"> {
  sender: "preview-container";
  forwardedFor: "previewer";
}

export interface PreviewMessageContainerPreviewerContextMenuOnBrick
  extends Omit<PreviewMessagePreviewerContextMenuOnBrick, "sender"> {
  sender: "preview-container";
  forwardedFor: "previewer";
}

export interface BrickOutline {
  width: number;
  height: number;
  left: number;
  top: number;
  alias?: string;
}

export type UpdateStoryboardType = "route" | "template" | "snippet";

export interface PreviewStartOptions {
  appId: string;
  templateId?: string;
  // formId?: string;
  // formData?: FormData;
  snippetData?: any;
  routePath?: string;
  routeExact?: boolean;
  settings?: PreviewSettings;
  updateStoryboardType?: UpdateStoryboardType;
}

export interface PreviewSettings {
  properties?: Record<string, unknown>;
}

export type WorkbenchBackendCacheAction =
  | WorkbenchBackendActionForInit
  | WorkbenchBackendActionForGet
  | WorkbenchBackendActionForInsert
  | WorkbenchBackendActionForUpdate
  | WorkbenchBackendActionForMove
  | WorkbenchBackendActionForDelete
  | WorkbenchBackendActionForInsertSnippet
  | WorkbenchBackendActionForCopyData
  | WorkbenchBackendActionForCopyBrick
  | WorkbenchBackendActionForCutBrick
  | WorkbenchBackendActionForBatchOp;

interface WorkbenchBackendCacheActionCommon {
  uid?: string;
  state?: "pending" | "resolve" | "reject";
  isBuilding?: boolean;
}

export interface WorkbenchBackendActionForInitDetail {
  appId: string;
  projectId: string;
  objectId: string;
  // rootNode: BuilderRuntimeNode;
  rootNode: unknown;
  delayBuildTime: number;
}

export interface WorkbenchBackendActionForInit
  extends WorkbenchBackendCacheActionCommon {
  action: "init";
  data: WorkbenchBackendActionForInitDetail;
}

export interface WorkbenchBackendActionForGet
  extends WorkbenchBackendCacheActionCommon {
  action: "get";
  data: {
    instanceId: string;
  };
}

export interface WorkbenchSortData {
  nodeUids?: number[];
  nodeIds: string[];
  nodeInstanceIds: string[];
}

export type WorkbenchBackendActionForInsertDetail = {
  parentInstanceId?: string;
  parent: string;
  mountPoint: string;
  brick: string;
  sort?: number;
  portal?: boolean;
  bg?: boolean;
  // nodeData: BuilderRuntimeNode;
  nodeData: unknown;
  dragOverInstanceId?: string;
  dragStatus?: unknown;
  sortData?: WorkbenchSortData;
  type: "brick" | "provider";
};
export interface WorkbenchBackendActionForInsert
  extends WorkbenchBackendCacheActionCommon {
  action: "insert";
  data: WorkbenchBackendActionForInsertDetail;
}

export interface WorkbenchBackendActionForUpdateDetail {
  objectId: string;
  instanceId: string;
  property: Record<string, any>;
  mtime: string;
}

export interface WorkbenchBackendActionForUpdate
  extends WorkbenchBackendCacheActionCommon {
  action: "update";
  data: WorkbenchBackendActionForUpdateDetail;
}

export interface WorkbenchBackendActionForMoveDetail {
  nodeInstanceId: string;
  nodeUid: number;
  nodeIds: string[];
  nodeInstanceIds: string[];
  // nodeData: NodeInstance;
  nodeData: unknown;
  objectId: string;
  mtime?: string;
}

export interface WorkbenchBackendActionForMove
  extends WorkbenchBackendCacheActionCommon {
  action: "move";
  data: WorkbenchBackendActionForMoveDetail;
}

export interface WorkbenchBackendActionForDeleteDetail {
  objectId: string;
  instanceId: string;
}

export interface WorkbenchBackendActionForDelete
  extends WorkbenchBackendCacheActionCommon {
  action: "delete";
  data: WorkbenchBackendActionForDeleteDetail;
}

type WorkbenchBackendActionForInsertSnippetDetail =
  WorkbenchBackendActionForInsertDetail & {
    // snippetData?: EventDetailOfSnippetApply;
    snippetData?: unknown;
  };

export interface WorkbenchBackendActionForInsertSnippet
  extends WorkbenchBackendCacheActionCommon {
  action: "insert.snippet";
  data: WorkbenchBackendActionForInsertSnippetDetail;
}

export interface WorkbenchBackendActionForCopyData
  extends WorkbenchBackendCacheActionCommon {
  action: "copy.data";
  data: WorkbenchBackendActionForUpdateDetail;
  sourceName: string;
}

export interface WorkbenchBackendActionForCutBrick
  extends WorkbenchBackendCacheActionCommon {
  action: "cut.brick";
  data: /* Partial<ModelInstanceRelationRequest> & */ {
    sourceBrickId: string;
  };
}
export interface WorkbenchBackendActionForCopyBrick
  extends WorkbenchBackendCacheActionCommon {
  action: "copy.brick";
  data: /* StoryboardApi_CloneBricksRequestBody & */ {
    sourceBrickId: string;
  };
}

export interface WorkbenchBackendActionForBatchOpDetail {
  insert: WorkbenchBackendActionForInsertDetail[];
  update: WorkbenchBackendActionForUpdateDetail[];
  delete: WorkbenchBackendActionForDeleteDetail[];
}

export interface WorkbenchBackendActionForBatchOp
  extends WorkbenchBackendCacheActionCommon {
  action: "batch.op";
  data: WorkbenchBackendActionForBatchOpDetail;
}

export type BackendMessage =
  | BackendMessageForInsert
  | BackendMessageForInstanceResponse
  | BackendMessageForUpdateGraphData
  | BackMessageForBuildStart
  | BackMessageForBuildSuccess
  | BackMessageForSnippetSuccess
  | BackMessageForBuildFail
  | BackendMessageForError
  | BackendMessageForExecuteSuccess;

export interface BackendMessageForInsert {
  action: "insert";
  data: WorkbenchBackendActionForInsertDetail;
  // newData: BuilderBrickNode;
  newData: unknown;
}

export interface BackendMessageForInstanceResponse {
  action: "instance-success" | "instance-fail";
  data: WorkbenchBackendCacheAction;
}

export interface BackMessageForSnippetSuccess {
  action: "snippet-success";
  data: {
    snippetId: string;
    // nodeData: BuilderRuntimeNode;
    nodeData: unknown;
  } /* & EventDetailOfSnippetApplyStored */;
}

export interface BackendMessageForUpdateGraphData {
  action: "update-graph-data";
  data: {
    graphData: pipes.GraphData;
  };
}

export interface BackMessageForBuildStart {
  action: "build-start";
  data?: unknown;
}

export interface BackMessageForBuildSuccess {
  action: "build-success";
  data: {
    // storyboard: Partial<StoryboardToBuild>;
    storyboard: unknown;
    isNeedRefresh?: boolean;
  };
}

export interface BackMessageForBuildFail {
  action: "build-fail";
  data?: {
    title: string;
    content?: string;
  };
}

export interface BackendMessageForError {
  action: "error";
  data: {
    error: string;
  };
}

export interface BackendMessageForExecuteSuccess {
  action: "execute-success";
  data: {
    res: any;
    op: string;
  };
}
