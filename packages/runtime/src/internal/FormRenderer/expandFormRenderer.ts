import type { BrickConf, BrickEventsMap } from "@next-core/types";
import { hasOwnProperty } from "@next-core/utils/general";
import { uniqueId } from "lodash";
import { DataStore } from "../data/DataStore.js";
import type { AsyncPropertyEntry, RuntimeBrick } from "../interfaces.js";
import type {
  FieldProperties,
  FormDataProperties,
  FormSchemaProperties,
} from "./interfaces.js";
import { getDefaultProperties } from "./getDefaultProperties.js";
import { symbolForFormStateStoreId } from "./constants.js";
import type { RendererContext } from "../RendererContext.js";

const formContainers = ["forms.general-form", "form.general-form", "eo-form"];

export function expandFormRenderer(
  formData: unknown,
  hostBrickConf: BrickConf,
  hostBrick: RuntimeBrick,
  asyncHostPropertyEntries: AsyncPropertyEntry[],
  rendererContext: RendererContext
): BrickConf {
  const normalizedFormData = (
    typeof formData === "string" ? JSON.parse(formData) : formData
  ) as FormDataProperties;

  const formStateStoreId = uniqueId("form-state-");
  const runtimeContext = {
    ...hostBrick.runtimeContext,
    formStateStoreId,
  };

  // There is a boundary for `forEachItem` and `STATE` between form internals and externals.
  delete runtimeContext.forEachItem;
  delete runtimeContext.forEachIndex;
  delete runtimeContext.tplStateStoreId;

  const formStateStore = new DataStore(
    "FORM_STATE",
    undefined,
    rendererContext,
    formStateStoreId
  );
  runtimeContext.formStateStoreMap.set(formStateStoreId, formStateStore);
  if (runtimeContext.formStateStoreScope) {
    runtimeContext.formStateStoreScope.push(formStateStore);
  }

  // Always add a state of `params`.
  const context = normalizedFormData.context ?? [];
  if (!context.some((ctx) => ctx.name === "params")) {
    context.push({ name: "params" });
  }

  formStateStore.define(context, runtimeContext, asyncHostPropertyEntries);

  const formConf = formSchemaToBrick(
    normalizedFormData.formSchema,
    normalizedFormData.fields,
    formStateStoreId
  );

  if (formContainers.includes(formConf.brick) && hostBrickConf.events) {
    formConf.events = mergeEvents(formConf.events, hostBrickConf.events);
  }

  const renderRoot =
    typeof hostBrickConf.properties?.renderRoot !== "boolean" ||
    hostBrickConf.properties.renderRoot;

  if (renderRoot) {
    return {
      ...hostBrickConf,
      slots: undefined,
      children: [
        {
          brick: "eo-micro-view",
          properties: { style: { padding: "12px" } },
          children: [formConf],
        },
      ],
    };
  }

  return {
    ...hostBrickConf,
    slots: undefined,
    children: [formConf],
  };
}

function formSchemaToBrick(
  schema: FormSchemaProperties,
  fields: FieldProperties[],
  formStateStoreId: string
): BrickConf {
  const { id, bricks, events, context, mountPoint, instanceId: iid } = schema;
  let { brick, properties } = schema;

  // 根据字段类型获取默认配置
  const field = fields.find((item: FieldProperties) => item.fieldId === id);
  if (field) {
    const defaults = getDefaultProperties(field);
    if (!brick) {
      brick = defaults.brick;
    }
    properties = {
      ...defaults.properties,
      ...properties,
    };
  }

  const brickConf = {
    brick,
    properties,
    iid,
    slot: mountPoint,
    events,
    context,
    children: formSchemasToBricks(bricks, fields, formStateStoreId),
    [symbolForFormStateStoreId]: formStateStoreId,
  } as BrickConf;

  if (hasOwnProperty(schema, "if")) {
    brickConf.if = schema.if;
  }

  return brickConf;
}

function formSchemasToBricks(
  schemas: FormSchemaProperties[] | undefined,
  fields: FieldProperties[],
  formStateStoreId: string
): BrickConf[] | undefined {
  if (Array.isArray(schemas)) {
    return schemas.map((schema) =>
      formSchemaToBrick(schema, fields, formStateStoreId)
    );
  }
}

function mergeEvents(
  targetEvents: BrickEventsMap | undefined,
  sourceEvents: BrickEventsMap
): BrickEventsMap {
  const events = targetEvents ?? {};

  for (const [eventType, handlers] of Object.entries(sourceEvents)) {
    events[eventType] = hasOwnProperty(events, eventType)
      ? [events[eventType], handlers].flat()
      : handlers;
  }

  return events;
}
