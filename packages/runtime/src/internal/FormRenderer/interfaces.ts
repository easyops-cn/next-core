import type {
  BrickEventsMap,
  ContextConf,
  ResolveConf,
} from "@next-core/types";

export interface FormDataProperties {
  formSchema: FormSchemaProperties;
  fields: FieldProperties[];
  context?: ContextConf[];
  // [key: string]: any;
}

export interface FormSchemaProperties {
  id: string;
  brick?: string;
  sort?: number;
  mountPoint?: string;
  events?: BrickEventsMap;
  properties?: Record<string, unknown>;
  if?: string | boolean | ResolveConf;
  instanceId?: string;
  context?: ContextConf[];
  bricks?: FormSchemaProperties[];
  // [key: string]: any;
}

export interface FieldProperties {
  defaultValue?: string;
  description?: string;
  fieldId: string;
  limit?: string[];
  name: string;
  fieldType: string;
  // [key: string]: any;
}

export interface DefaultFieldProperties {
  brick: string;
  properties: Record<string, unknown>;
}
