export enum LexicalStatus {
  Initial,
  ExpectField,
  ExpectOptionalBeginDefault,
  ExpectDefaultValue,
  ExpectOptionalBeginPipe,
  ExpectPipeIdentifier,
  ExpectOptionalBeginPipeParameter,
  ExpectPipeParameter,
  ExpectPlaceholderEnd
}

export enum TokenType {
  Raw = "Raw",
  BeginPlaceHolder = "BeginPlaceHolder",
  Field = "Field",
  BeginDefault = "BeginDefault",
  LegacyLiteral = "LegacyLiteral",
  BeginPipe = "BeginPipe",
  PipeIdentifier = "PipeIdentifier",
  BeginPipeParameter = "BeginPipeParameter",
  EndPlaceHolder = "EndPlaceHolder",
  JsonValue = "JsonValue"
}

export enum JsonValueType {
  Array,
  Object,
  String,
  Others
}

export interface LexicalContext {
  beginPlaceholder: string;
  raw: string;
  cursor: number;
  status: LexicalStatus;
  tokens: Token[];
}

export interface Token {
  type: TokenType;
  value?: any;
  loc?: SourceLocation;
}

export interface SourceLocation {
  start: number;
  end: number;
}

export interface Node {
  type: string;
  loc?: SourceLocation;
}

export interface InjectableString extends Node {
  type: "InjectableString";
  elements: (RawString | Placeholder)[];
}

export interface RawString extends Node {
  type: "RawString";
  value: string;
}

export interface Placeholder extends Node {
  type: "Placeholder";
  field: string;
  defaultValue: any;
  pipes: PipeCall[];
}

export interface PipeCall extends Node {
  type: "PipeCall";
  identifier: string;
  parameters: any[];
}
