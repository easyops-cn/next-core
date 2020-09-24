import { BrickConf } from "./manifest";
import { MenuIcon } from "./menu";

/** @internal */
export interface I18nString {
  en: string;
  zh: string;
}

/** @internal */
export interface CategoryGroup {
  group: string;
  title: I18nString;
  items: Chapter[];
}

/** @internal */
export interface Chapter {
  category: string;
  title: I18nString;
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
  storyId: string;
  deprecated?: boolean;
  type: "brick" | "template";
  text: I18nString;
  conf: StoryConf | StoryConf[];
  description?: I18nString;
  tags?: I18nString[];
  doc?: string | StoryDoc;
  actions?: Action[];
  icon?: MenuIcon;
  previewColumns?: number;
  author?: string;
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
}

/** @internal */
export interface StoryDocTemplate {
  module: string;
  children: StoryDoc[];
}
