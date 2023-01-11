import {
  BrickConf,
  BrickEventHandler,
  BrickEventsMap,
  ContextConf,
  PluginRuntimeContext,
  ResolveConf,
} from "@next-core/brick-types";
import _ from "lodash";
import type { LocationContext } from "../LocationContext";
import { filterProperties, symbolForFormContextId } from "./constants";
import { CustomFormContext } from "./CustomFormContext";

export function ExpandCustomForm(
  formData: FormDataProperties,
  brickConf: BrickConf,
  isPreview: boolean | undefined,
  context?: any
): BrickConf {
  const formContext = new CustomFormContext();
  formData = initFormContext(formData, brickConf, isPreview);
  if (Array.isArray(formData.context)) {
    formContext.formState.syncDefine(
      formData.context,
      { ...context, formContextId: formContext.id },
      {}
    );
  }

  return getFinalStoryBoard(formData, brickConf, isPreview, formContext);
}

export async function AsyncExpandCustomForm(
  formData: FormDataProperties,
  brickConf: BrickConf,
  isPreview: boolean | undefined,
  context?: PluginRuntimeContext,
  locationContext?: LocationContext
): Promise<BrickConf> {
  const formContext = new CustomFormContext();
  formData = initFormContext(formData, brickConf, isPreview);
  if (Array.isArray(formData.context)) {
    if (locationContext) {
      // Handle use cases of using `CTX.*` in template states.
      await locationContext.storyboardContextWrapper.waitForUsedContext(
        formData.context.map((state) => [state.if, state.value, state.resolve])
      );
    }
    await formContext.formState.define(
      formData.context,
      { ...context, formContextId: formContext.id },
      {}
    );
  }
  return getFinalStoryBoard(formData, brickConf, isPreview, formContext);
}
export interface FormDataProperties {
  formSchema?: FormSchemaProperties;
  fields?: FieldProperties[];
  context?: ContextConf[];
  [key: string]: any;
}
export interface FormSchemaProperties {
  id?: string;
  brick?: string;
  sort?: number;
  mountPoint?: string;
  events?: BrickEventsMap;
  properties?: Record<string, unknown>;
  if?: string | boolean | ResolveConf;
  [key: string]: any;
}
export interface FieldProperties {
  defaultValue?: string;
  description?: string;
  fieldId: string;
  limit?: string[];
  name: string;
  fieldType: string;
  [key: string]: any;
}

export interface DefaultFieldProperties {
  brick: string;
  properties: { [key: string]: any };
}
export function getDefaultProperties(
  _name: string,
  fields: FieldProperties[]
): DefaultFieldProperties | { [key: string]: any } {
  const field: FieldProperties = fields.filter(
    (item: FieldProperties) => item.fieldId === _name
  )[0];

  if (field) {
    let defaultValue: DefaultFieldProperties = {
      brick: "forms.general-input",
      properties: {
        id: field.fieldId,
        name: field.fieldId,
        label: field.name,
        readOnly: field.limit.includes("READONLY"),
        required: field.limit.includes("REQUIRED"),
        placeholder: field.description,
      },
    };
    switch (field.fieldType) {
      case "STRING":
        defaultValue = {
          brick: "forms.general-input",
          properties: {
            id: field.fieldId,
            name: field.fieldId,
            label: field.name,
            readOnly: field.limit.includes("READONLY"),
            required: field.limit.includes("REQUIRED"),
            placeholder: field.description,
          },
        };
        break;
      case "INT":
        defaultValue = {
          brick: "forms.general-input-number",
          properties: {
            id: field.fieldId,
            name: field.fieldId,
            label: field.name,
            readOnly: field.limit.includes("READONLY"),
            required: field.limit.includes("REQUIRED"),
            placeholder: field.description,
            precision: 0,
            inputBoxStyle: { width: "100%" },
          },
        };
        break;
      case "BOOLEAN":
        defaultValue = {
          brick: "forms.general-switch",
          properties: {
            id: field.fieldId,
            name: field.fieldId,
            label: field.name,
            readOnly: field.limit.includes("READONLY"),
            required: field.limit.includes("REQUIRED"),
          },
        };
        break;
      case "FLOAT":
        defaultValue = {
          brick: "forms.general-input-number",
          properties: {
            id: field.fieldId,
            name: field.fieldId,
            label: field.name,
            readOnly: field.limit.includes("READONLY"),
            required: field.limit.includes("REQUIRED"),
            placeholder: field.description,
            inputBoxStyle: { width: "100%" },
          },
        };
        break;
      case "ENUM":
        defaultValue = {
          brick: "forms.general-select",
          properties: {
            id: field.fieldId,
            name: field.fieldId,
            label: field.name,
            readOnly: field.limit.includes("READONLY"),
            required: field.limit.includes("REQUIRED"),
            options: [
              { label: "选项一", value: 1 },
              { label: "选项二", value: 2 },
            ],
            placeholder: field.description,
            inputBoxStyle: { width: "100%" },
          },
        };
        break;
      case "ENUMS":
        defaultValue = {
          brick: "forms.general-select",
          properties: {
            id: field.fieldId,
            name: field.fieldId,
            label: field.name,
            readOnly: field.limit.includes("READONLY"),
            required: field.limit.includes("REQUIRED"),
            mode: "multiple",
            options: [
              { label: "选项一", value: 1 },
              { label: "选项二", value: 2 },
            ],
            placeholder: field.description,
            inputBoxStyle: { width: "100%" },
          },
        };
        break;
      case "DATE":
        defaultValue = {
          brick: "forms.general-date-picker",
          properties: {
            id: field.fieldId,
            name: field.fieldId,
            label: field.name,
            readOnly: field.limit.includes("READONLY"),
            required: field.limit.includes("REQUIRED"),
            placeholder: field.description,
          },
        };
        break;
      case "TIME":
        defaultValue = {
          brick: "forms.general-date-picker",
          properties: {
            id: field.fieldId,
            name: field.fieldId,
            label: field.name,
            readOnly: field.limit.includes("READONLY"),
            required: field.limit.includes("REQUIRED"),
            placeholder: field.description,
          },
        };
        break;
      case "IP":
        /* eslint-disable */
        defaultValue = {
          brick: "forms.general-input",
          properties: {
            id: field.fieldId,
            name: field.fieldId,
            label: field.name,
            readOnly: field.limit.includes("READONLY"),
            required: field.limit.includes("REQUIRED"),
            placeholder: field.description,
            pattern:
              "((^s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))s*$)|(^s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:)))(%.+)?s*$))",
            message: {
              pattern: "输入字符不匹配IP格式",
            },
          },
        };
        /* eslint-disable */
        break;
      case "JSON":
        defaultValue = {
          brick: "forms.general-textarea",
          properties: {
            id: field.fieldId,
            name: field.fieldId,
            label: field.name,
          },
        };
        break;
      case "ARRAY":
        defaultValue = {
          brick: "forms.general-select",
          properties: {
            id: field.fieldId,
            name: field.fieldId,
            label: field.name,
          },
        };
        break;
      case "STRUCTURE":
        defaultValue = {
          brick: "forms.cmdb-instance-select-panel",
          properties: {
            id: field.fieldId,
            name: field.fieldId,
            label: field.name,
            readOnly: field.limit.includes("READONLY"),
            required: field.limit.includes("REQUIRED"),
          },
        };
        break;
      case "STRUCTURE_ARRAY":
        defaultValue = {
          brick: "forms.cmdb-instance-select-panel",
          properties: {
            id: field.fieldId,
            name: field.fieldId,
            label: field.name,
            readOnly: field.limit.includes("READONLY"),
            required: field.limit.includes("REQUIRED"),
          },
        };
        break;
      default:
        break;
    }
    defaultValue.properties.dataset = { testid: field.fieldId };
    return defaultValue;
  } else return {};
}

export function getStoryboard(
  dataSource: FormSchemaProperties[],
  result: any[],
  fields: FieldProperties[],
  isPreview: boolean | undefined,
  formContextId: string
): BrickConf[] {
  for (let i = 0; i < dataSource.length; i++) {
    const dataItem = dataSource[i];
    let resultItem: { [key: string]: any } = {};
    //数据初始化：根据id,字段类型获取默认属性
    const defaultProperties: any = getDefaultProperties(dataItem.id, fields);
    if (dataItem.brick === "forms.general-form" && isPreview) {
      dataItem.properties = {
        ...dataItem.properties,
        className: "form-preview",
      };
      dataItem.events = {
        ...dataItem.events,
        "validate.error": [
          {
            action: "preview.debug",
            args: ["validate.error", "<% EVENT.detail %>"],
          },
        ],
        "validate.success": [
          {
            action: "preview.debug",
            args: ["validate.success", "<% EVENT.detail %>"],
          },
        ],
      };
    }
    //数据初始化：与默认属性进行合并
    Object.keys(defaultProperties).forEach((item) => {
      if (!dataItem[item]) {
        dataItem[item] = defaultProperties[item];
      } else if (dataItem[item] && typeof dataItem[item] === "object") {
        dataItem[item] = { ...defaultProperties[item], ...dataItem[item] };
      }
    });

    Object.keys(dataItem).forEach((item) => {
      if (filterProperties.includes(item)) {
        const key = item === "instanceId" ? "iid" : item;
        resultItem[key] = dataItem[item];
      }
    });

    if (Array.isArray(dataItem.bricks)) {
      resultItem["slots"] = _.groupBy(
        getStoryboard(dataItem.bricks, [], fields, isPreview, formContextId),
        "mountPoint"
      );
      Object.keys(resultItem["slots"])?.forEach((item) => {
        resultItem.slots[item] = {
          bricks: resultItem.slots[item],
          type: "bricks",
        };
      });
    }
    resultItem = {
      ...resultItem,
      [symbolForFormContextId]: formContextId,
    };
    result[i] = resultItem;
  }
  return result;
}

export function initFormContext(
  formData: FormDataProperties,
  brickConf: BrickConf,
  isPreview: boolean | undefined
): FormDataProperties {
  if (
    isPreview &&
    formData.formSchema &&
    formData.formSchema.brick === "forms.general-form"
  ) {
    brickConf["properties"] = {
      ...brickConf.properties,
      ...(formData.formSchema.properties?.previewConf as object),
    };
  }
  if (Array.isArray(formData.context)) {
    formData.context.forEach((item) => {
      if (brickConf.properties[item.name] !== undefined) {
        item.value = brickConf.properties[item.name];
      }
    });
    if (brickConf.properties.condition) {
      formData.context.push({
        name: "condition",
        value: brickConf.properties.condition,
      });
    }
  }
  return formData;
}

export function getFinalStoryBoard(
  formData: FormDataProperties,
  brickConf: BrickConf,
  isPreview: boolean | undefined,
  formContext: CustomFormContext
): BrickConf {
  let result = null;
  const errorBrick = {
    brick: "presentational-bricks.brick-illustration",
    properties: {
      category: "default",
      header: {
        title: "参数错误",
      },
      mode: "guide",
      name: "search-empty",
    },
  };
  try {
    const formStoryboard = getStoryboard(
      [formData.formSchema],
      [],
      formData.fields,
      isPreview,
      formContext.id
    );
    formStoryboard[0] = _.isEmpty(formStoryboard[0])
      ? errorBrick
      : formStoryboard[0];

    if (formStoryboard[0].brick === "forms.general-form" && brickConf.events) {
      const brickConfEvents = brickConf.events;
      const events = formStoryboard[0].events ?? {};
      Object.keys(brickConfEvents).forEach((item) => {
        const newEvents = (
          Array.isArray(events[item]) ? events[item] : [events[item]]
        ) as BrickEventHandler[];
        const itemEvents = (
          Array.isArray(brickConfEvents[item])
            ? brickConfEvents[item]
            : [brickConfEvents[item]]
        ) as BrickEventHandler[];
        events[item] = _.compact([...newEvents, ...itemEvents]);
      });
      formStoryboard[0].events = events;
    }
    result = {
      ...brickConf,
      brick: "div",
      slots: {
        "": {
          bricks: [
            {
              brick: "basic-bricks.micro-view",
              properties: { style: { padding: "12px" } },
              slots: { content: { bricks: formStoryboard, type: "bricks" } },
            },
          ],
          type: "bricks",
        },
      },
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(error.message);
    result = {
      brick: "div",
      slots: {
        "": {
          bricks: [errorBrick],
          type: "bricks",
        },
      },
    };
  }
  return result as BrickConf;
}
