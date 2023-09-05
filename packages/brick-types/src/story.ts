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
export interface SrcIcon {
  imgSrc?: string;
  imgStyle?: React.CSSProperties;
}

/** @internal */
export interface SnippetConf {
  bricks: BrickConf | BrickConf[];
  snippetId?: string;
  title: I18nData;
  message?: I18nData;
  thumbnail?: string;
  actions?: Action[];
}

/** @internal */
export type mixConf = StoryConf | SnippetConf;

/** @internal */
export interface V3StoryConf {
  doc?: string;
}

/** @internal */
export interface Story {
  category: string;
  storyId: string;
  deprecated?: boolean;
  type: "brick" | "template";
  text: I18nData;
  conf: StoryConf | StoryConf[] | mixConf[] | V3StoryConf;
  description?: I18nData;
  tags?: I18nData[];
  doc?: string | StoryDoc;
  actions?: Action[];
  icon?: MenuIcon | SrcIcon;
  previewColumns?: number;
  author?: string;
  layerType?: LayerType;
  originData?: BuilderCustomTemplateNode;
  isCustomTemplate?: boolean;
  useWidget?: string[];
  v3Brick?: boolean;
  source?: string;
  alias?: string[];
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
export interface StoryDocEnumChild {
  name: string;
  value: string;
  description?: string;
}

/** @internal */
export interface StoryDocInterfaceProperty {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

/** @internal */
export interface StoryDocTypeParameter {
  name: string;
  type: string;
}

/** @internal */
export interface StoryDocInterfaceIndexSignature
  extends StoryDocInterfaceProperty {
  parameters: StoryDocTypeParameter[];
}

/** @internal */
export interface StoryDocType {
  name: string;
  type: string;
  kind: "type";
  typeParameter: string;
  description?: string;
}

/** @internal */
export interface StoryDocEnum {
  name: string;
  typeParameter: string;
  kind: "enum";
  children: StoryDocEnumChild[];
  description?: string;
}

/** @internal */
interface SomeType {
  name: string;
  type: string;
}

/** @internal */
export interface StoryDocInterface {
  name: string;
  typeParameter: string;
  kind: "interface";
  extendedTypes?: SomeType[];
  description?: string;
  children?: StoryDocInterfaceProperty[];
  indexSignature?: StoryDocInterfaceIndexSignature[];
}

/** @internal */
export interface StoryDoc {
  id: string;
  name: string;
  author: string;
  deprecated?: boolean;
  description?: string;
  memo?: MarkdownString;
  interface?: (StoryDocInterface | StoryDocEnum | StoryDocType)[];
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
