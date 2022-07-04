import { BrickConf, BrickEventsMap, ResolveConf } from "@next-core/brick-types";
import _ from "lodash";
import { filterProperties } from "./constants";

export function ExpandCustomForm(
  formData: formDataProperties,
  brickConf: BrickConf
): BrickConf {
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
      formData.fields
    );
    formStoryboard[0] = _.isEmpty(formStoryboard[0])
      ? errorBrick
      : formStoryboard[0];
    return {
      ...brickConf,
      brick: "div",
      slots: { "": { bricks: formStoryboard, type: "bricks" } },
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(error.message);
    return {
      brick: "div",
      slots: {
        "": {
          bricks: [errorBrick],
          type: "bricks",
        },
      },
    };
  }
}
export interface formDataProperties {
  formSchema?: formSchemaProperties;
  fields?: fieldProperties[];
  [key: string]: any;
}
export interface formSchemaProperties {
  id?: string;
  brick?: string;
  sort?: number;
  mountPoint?: string;
  events?: BrickEventsMap;
  properties?: Record<string, unknown>;
  if?: string | boolean | ResolveConf;
  [key: string]: any;
}
export interface fieldProperties {
  defaultValue?: string;
  description?: string;
  id: string;
  limit?: string[];
  name: string;
  type: string;
  [key: string]: any;
}

export interface defaultFieldProperties {
  brick: string;
  properties: { [key: string]: any };
}
export function getDefaultProperties(
  _name: string,
  fields: fieldProperties[]
): defaultFieldProperties | { [key: string]: any } {
  const field: fieldProperties = fields.filter(
    (item: { id: string }) => item.id === _name
  )[0];
  let defaultValue = {};
  if (field) {
    switch (field.type) {
      case "STRING":
        defaultValue = {
          brick: "forms.general-input",
          properties: {
            id: field.id,
            name: field.id,
            label: field.name,
            readOnly: field.limit.includes("readOnly"),
            required: field.limit.includes("required"),
            placeholder: field.description,
          },
        };
        break;
      case "INT":
        defaultValue = {
          brick: "forms.general-input-number",
          properties: {
            id: field.id,
            name: field.id,
            label: field.name,
            readOnly: field.limit.includes("readOnly"),
            required: field.limit.includes("required"),
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
            id: field.id,
            name: field.id,
            label: field.name,
            readOnly: field.limit.includes("readOnly"),
            required: field.limit.includes("required"),
          },
        };
        break;
      case "FLOAT":
        defaultValue = {
          brick: "forms.general-input-number",
          properties: {
            id: field.id,
            name: field.id,
            label: field.name,
            readOnly: field.limit.includes("readOnly"),
            required: field.limit.includes("required"),
            placeholder: field.description,
            inputBoxStyle: { width: "100%" },
          },
        };
        break;
      case "ENUMERATED_SINGLE_OPTION":
        defaultValue = {
          brick: "forms.general-select",
          properties: {
            id: field.id,
            name: field.id,
            label: field.name,
            readOnly: field.limit.includes("readOnly"),
            required: field.limit.includes("required"),
            options: [
              { label: "选项一", value: 1 },
              { label: "选项二", value: 2 },
            ],
            placeholder: field.description,
            inputBoxStyle: { width: "100%" },
          },
        };
        break;
      case "SELECT_MULTIPLE_ENUMERATED_TYPE":
        defaultValue = {
          brick: "forms.general-select",
          properties: {
            id: field.id,
            name: field.id,
            label: field.name,
            readOnly: field.limit.includes("readOnly"),
            required: field.limit.includes("required"),
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
            id: field.id,
            name: field.id,
            label: field.name,
            readOnly: field.limit.includes("readOnly"),
            required: field.limit.includes("required"),
            placeholder: field.description,
          },
        };
        break;
      case "TIME":
        defaultValue = {
          brick: "forms.general-date-picker",
          properties: {
            id: field.id,
            name: field.id,
            label: field.name,
            readOnly: field.limit.includes("readOnly"),
            required: field.limit.includes("required"),
            placeholder: field.description,
          },
        };
        break;
      case "IP":
        defaultValue = {
          brick: "forms.general-input",
          properties: {
            id: field.id,
            name: field.id,
            label: field.name,
            readOnly: field.limit.includes("readOnly"),
            required: field.limit.includes("required"),
            placeholder: field.description,
            pattern:
              /((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))/,
          },
        };
        break;
      case "JSON":
        defaultValue = {};
        break;
      case "ARRAY":
        defaultValue = {};
        break;
      case "STRUCTURE":
        defaultValue = {
          brick: "forms.cmdb-instance-select-panel",
          properties: {
            id: field.id,
            name: field.id,
            label: field.name,
            readOnly: field.limit.includes("readOnly"),
            required: field.limit.includes("required"),
          },
        };
        break;
      case "STRUCTURE_ARRAY":
        defaultValue = {
          brick: "forms.cmdb-instance-select-panel",
          properties: {
            id: field.id,
            name: field.id,
            label: field.name,
            readOnly: field.limit.includes("readOnly"),
            required: field.limit.includes("required"),
          },
        };
        break;
      default:
        defaultValue = {
          brick: "forms.general-input",
          properties: {
            id: field.id,
            name: field.id,
            label: field.name,
            readOnly: field.limit.includes("readOnly"),
            required: field.limit.includes("required"),
            placeholder: field.description,
          },
        };
        break;
    }
  }

  return defaultValue;
}

export function getStoryboard(
  datasource: formSchemaProperties[],
  result: any[],
  fields: fieldProperties[]
): BrickConf[] {
  for (let i = 0; i < datasource.length; i++) {
    const dataItem = datasource[i];
    const resultItem: { [key: string]: any } = {};
    //数据初始化：根据id,字段类型获取默认属性
    const defaultProperties: any = getDefaultProperties(dataItem.id, fields);
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
        resultItem[item] = dataItem[item];
      }
    });

    if (Array.isArray(dataItem.bricks)) {
      resultItem["slots"] = _.groupBy(
        getStoryboard(dataItem.bricks, [], fields),
        "mountPoint"
      );
      Object.keys(resultItem["slots"])?.forEach((item) => {
        resultItem.slots[item] = {
          bricks: resultItem.slots[item],
          type: "bricks",
        };
      });
    }
    result[i] = resultItem;
  }
  return result;
}
