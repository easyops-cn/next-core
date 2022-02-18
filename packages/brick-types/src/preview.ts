/** @internal */
export interface PreviewHelperBrick {
  start(previewFromOrigin: string): void;
}

/** @internal */
export interface PreviewBaseMessage {
  sender: "builder" | "preview-container" | "previewer";
  type: string;
  forwardedFor?: "builder" | "previewer";
}

/** @internal */
export interface PreviewMessageBuilderHoverOnBrick extends PreviewBaseMessage {
  sender: "builder";
  type: "hover-on-brick";
  iid: string;
}

/** @internal */
export type PreviewMessageToPreviewer =
  | PreviewMessageContainerBuilderHoverOnBrick
  | PreviewMessageContainerToggleInspecting;

/** @internal */
export type PreviewMessageFromContainer =
  | PreviewMessageContainerBuilderHoverOnBrick
  | PreviewMessageContainerPreviewerHoverOnBrick
  | PreviewMessageContainerPreviewerSelectBrick;

/** @internal */
export type PreviewMessageToContainer =
  | PreviewMessageBuilderHoverOnBrick
  | PreviewMessagePreviewerHoverOnBrick
  | PreviewMessagePreviewerSelectBrick
  | PreviewMessagePreviewerPreviewStarted;

/** @internal */
export type PreviewerMessageToBuilder =
  | PreviewMessageContainerPreviewerHoverOnBrick
  | PreviewMessageContainerPreviewerSelectBrick;

/** @internal */
export interface PreviewMessagePreviewerPreviewStarted
  extends PreviewBaseMessage {
  sender: "previewer";
  type: "preview-started";
}

/** @internal */
export interface PreviewMessagePreviewerHoverOnBrick
  extends PreviewBaseMessage {
  sender: "previewer";
  type: "hover-on-brick";
  iidList: string[];
}

/** @internal */
export interface PreviewMessagePreviewerSelectBrick extends PreviewBaseMessage {
  sender: "previewer";
  type: "select-brick";
  iidList: string[];
}

/** @internal */
export interface PreviewMessageContainerStartPreview
  extends PreviewBaseMessage {
  sender: "preview-container";
  type: "start-preview";
}

/** @internal */
export interface PreviewMessageContainerToggleInspecting
  extends PreviewBaseMessage {
  sender: "preview-container";
  type: "toggle-inspecting";
  enabled: boolean;
}

/** @internal */
export interface PreviewMessageContainerBuilderHoverOnBrick
  extends Omit<PreviewMessageBuilderHoverOnBrick, "sender"> {
  sender: "preview-container";
  forwardedFor: "builder";
}

/** @internal */
export interface PreviewMessageContainerPreviewerHoverOnBrick
  extends Omit<PreviewMessagePreviewerHoverOnBrick, "sender"> {
  sender: "preview-container";
  forwardedFor: "previewer";
}

/** @internal */
export interface PreviewMessageContainerPreviewerSelectBrick
  extends Omit<PreviewMessagePreviewerSelectBrick, "sender"> {
  sender: "preview-container";
  forwardedFor: "previewer";
}
