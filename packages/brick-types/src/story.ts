import { BuilderCustomTemplateNode, LayerType } from "./builder";
import { BrickConf, I18nData } from "./manifest";
import { MenuIcon } from "./menu";

/** @internal */
export interface CategoryGroup {
  group: string;
  title: I18nData;
  items: Chapter[];
}

/** @internal */
export interface Chapter {
  category: string;
  title: I18nData;
  stories: Story[];
}

/** @internal */
export type MarkdownString = string;

/** @internal */
export interface StoryConf extends BrickConf {
  description?: {
    title: string;
    message?: MarkdownString;
  };
}

/** @internal */
export interface Story {
  category: string;
  id: string;
  deprecated?: boolean;
  type: "brick" | "template" | "atom-brick";
  text: I18nData;
  example: StoryConf | StoryConf[];
  description?: I18nData;
  tags?: I18nData[];
  doc?: string | StoryDoc;
  actions?: Action[];
  icon?: MenuIcon;
  previewColumns?: number;
  author?: string;
  layerType?: LayerType;
  originData?: BuilderCustomTemplateNode;
}

/** @internal */
export interface Action {
  text: string;
  method: string;
  type?: "link" | "ghost" | "default" | "primary" | "dashed" | "danger";
  args?: any[];
  prompt?: boolean;
}

/** @internal */
export interface StoryDocProperty {
  name: string;
  type: string;
  required: boolean;
  default: any;
  description: string;
  deprecated?: boolean;
}

/** @internal */
export interface StoryDocEvent {
  type: string;
  detail: string;
  description: string;
  deprecated?: boolean;
}

/** @internal */
export interface StoryDocMethod {
  name: string;
  anchor: string;
  description: string;
  deprecated?: boolean;
}

/** @internal */
export interface StoryDocSlot {
  name: string;
  description: string;
}

/** @internal */
export interface StoryDocHistory {
  version: number;
  change: string;
}

/** @internal */
export interface StoryDocEnum {
  name: string;
  value: string;
  description: string;
}

/** @internal */
export interface StoryDocTypeAndInterface {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

/** @internal */
export interface StoryDocType {
  name: string;
  type: string;
  kind: boolean;
  typeParameter: string;
  description: string;
}

/** @internal */
export interface StoryDocInterface {
  name: string;
  typeParameter: string;
  kind: "interface" | "enum" | "type";
  children: StoryDocTypeAndInterface[] | StoryDocEnum[];
}

/** @internal */
export interface StoryDoc {
  id: string;
  name: string;
  author: string;
  deprecated?: boolean;
  description?: string;
  memo?: MarkdownString;
  interface?: (StoryDocInterface | StoryDocType)[];
  history: StoryDocHistory[];
  slots?: StoryDocSlot[];
  events?: StoryDocEvent[];
  methods?: StoryDocMethod[];
  properties: StoryDocProperty[];
  editor?: string;
  editorProps?: Record<string, unknown>;
}

/** @internal */
export interface StoryDocTemplate {
  module: string;
  children: StoryDoc[];
}
