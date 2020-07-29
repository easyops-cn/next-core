import { BrickConf } from "./manifest";
import { MenuIcon } from "./menu";

export interface I18nString {
  en: string;
  zh: string;
}

export interface CategoryGroup {
  group: string;
  title: I18nString;
  items: Chapter[];
}

export interface Chapter {
  category: string;
  title: I18nString;
  stories: Story[];
}
export type MarkdownString = string;

export interface StoryConf extends BrickConf {
  description?: {
    title: string;
    message: MarkdownString;
  };
}

export interface Story {
  category?: string;
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

export interface Action {
  text: string;
  method: string;
  type?: "link" | "ghost" | "default" | "primary" | "dashed" | "danger";
  args?: any[];
  prompt?: boolean;
}

export interface StoryDocProperty {
  name: string;
  type: string;
  required: boolean;
  default: any;
  description: string;
  deprecated?: boolean;
}

export interface StoryDocEvent {
  type: string;
  detail: string;
  description: string;
  deprecated?: boolean;
}

export interface StoryDocMethod {
  name: string;
  anchor: string;
  description: string;
  deprecated?: boolean;
}

export interface StoryDocSlot {
  name: string;
  description: string;
}

export interface StoryDocHistory {
  version: number;
  change: string;
}

export interface StoryDocEnum {
  name: string;
  value: string;
  description: string;
}

export interface StoryDocTypeAndInterface {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface StoryDocType {
  name: string;
  type: string;
  kind: boolean;
  typeParameter: string;
  description: string;
}

export interface StoryDocInterface {
  name: string;
  typeParameter: string;
  kind: "interface" | "enum" | "type";
  children: StoryDocTypeAndInterface[] | StoryDocEnum[];
}

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

export interface StoryDocTemplate {
  module: string;
  children: StoryDoc[];
}
