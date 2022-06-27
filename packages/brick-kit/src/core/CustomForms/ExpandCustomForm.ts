import { PluginRuntimeContext, RuntimeBrickConf } from "@next-core/brick-types";
import { RuntimeBrick } from "../BrickNode";
import { customFormRegistry } from "./constants";
export function ExpandCustomForm(
  brickConf: any,
  proxyBrick: RuntimeBrick,
  context: PluginRuntimeContext
): any {
  //TODO: get formSchema and fields converted to brickconf
  // const _brickConf = getStoryboard(customFormRegistry.get(brickConf['brick']), [], customFormRegistry.get(brickConf['brick']).fields)
  // return _brickConf;
}

export interface fieldProperties {
  creator?: string;
  ctime?: string;
  defaultValue?: string;
  deleteAuthorizers?: [];
  description?: string;
  id: string;
  instanceId?: string;
  limit?: string[];
  modifier?: string;
  mtime?: string;
  name: string;
  org?: number;
  readAuthorizers?: [];
  type: string;
  updateAuthorizers?: [];
  _object_id?: string;
  _object_version?: number;
  _pre_ts?: number;
  _ts?: number;
  _version?: number;
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
  )[0] ?? { type: "any", id: "field", name: "字段名" };
  let defaultValue;
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
          id: "field",
          name: "field",
          label: "字段名",
        },
      };
      break;
  }
  return defaultValue;
}

export function getStoryboard(
  datasource: any[],
  result: any[],
  fields: fieldProperties[]
): any {
  for (let i = 0; i < datasource.length; i++) {
    let _datasource = datasource[i];
    const _result = result[i] ?? {};
    //数据初始化：若存在引用，根据字段类型获取默认属性
    if (_datasource.quote) {
      _datasource = {
        ..._datasource,
        ...getDefaultProperties(_datasource.quote, fields),
      };
    }
    //数据初始化：若存在userDefiend，与默认属性进行合并
    if (_datasource.userDefined) {
      Object.keys(_datasource["userDefined"]).forEach((item) => {
        if (typeof _datasource[item] === "object")
          _datasource[item] = {
            ..._datasource[item],
            ..._datasource["userDefined"][item],
          };
        else _datasource[item] = _datasource["userDefined"][item];
      });
    }

    Object.keys(_datasource).forEach((item) => {
      if (!["bricks", "quote", "userDefined"].includes(item)) {
        _result[item] = _datasource[item];
      }
    });

    if (Array.isArray(_datasource.bricks)) {
      if (
        ["forms.general-form", "basic-bricks.grid-layout"].includes(
          _datasource.brick
        )
      ) {
        _result["slots"] = { items: { bricks: [], type: "bricks" } };
        _result.slots.items.bricks = getStoryboard(
          _datasource.bricks,
          _result.slots.items.bricks,
          fields
        );
      } else {
        _result["slots"] = { content: { bricks: [], type: "bricks" } };
        _result.slots.content.bricks = getStoryboard(
          _datasource.bricks,
          _result.slots.content.bricks,
          fields
        );
      }
    }

    result[i] = _result;
  }
  return result;
}
