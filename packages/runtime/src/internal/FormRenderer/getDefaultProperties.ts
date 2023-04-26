import type { DefaultFieldProperties, FieldProperties } from "./interfaces.js";

export function getDefaultProperties(
  field: FieldProperties
): DefaultFieldProperties {
  let defaultValue: DefaultFieldProperties;
  const commonProps = {
    id: field.fieldId,
    name: field.fieldId,
    label: field.name,
    dataset: {
      testid: field.fieldId,
    },
  };
  const getReadOnlyAndRequired = () => ({
    readOnly: field.limit?.includes("READONLY"),
    required: field.limit?.includes("REQUIRED"),
  });
  switch (field.fieldType) {
    case "INT":
      defaultValue = {
        brick: "forms.general-input-number",
        properties: {
          ...commonProps,
          ...getReadOnlyAndRequired(),
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
          ...commonProps,
          ...getReadOnlyAndRequired(),
        },
      };
      break;
    case "FLOAT":
      defaultValue = {
        brick: "forms.general-input-number",
        properties: {
          ...commonProps,
          ...getReadOnlyAndRequired(),
          placeholder: field.description,
          inputBoxStyle: { width: "100%" },
        },
      };
      break;
    case "ENUM":
      defaultValue = {
        brick: "forms.general-select",
        properties: {
          ...commonProps,
          ...getReadOnlyAndRequired(),
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
          ...commonProps,
          ...getReadOnlyAndRequired(),
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
    case "TIME":
      defaultValue = {
        brick: "forms.general-date-picker",
        properties: {
          ...commonProps,
          ...getReadOnlyAndRequired(),
          placeholder: field.description,
        },
      };
      break;
    case "IP":
      defaultValue = {
        brick: "forms.general-input",
        properties: {
          ...commonProps,
          ...getReadOnlyAndRequired(),
          placeholder: field.description,
          pattern:
            "((^s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))s*$)|(^s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:)))(%.+)?s*$))",
          message: {
            pattern: "输入字符不匹配IP格式",
          },
        },
      };
      break;
    case "JSON":
      defaultValue = {
        brick: "forms.general-textarea",
        properties: {
          ...commonProps,
        },
      };
      break;
    case "ARRAY":
      defaultValue = {
        brick: "forms.general-select",
        properties: {
          ...commonProps,
        },
      };
      break;
    case "STRUCTURE":
    case "STRUCTURE_ARRAY":
      defaultValue = {
        brick: "forms.cmdb-instance-select-panel",
        properties: {
          ...commonProps,
          ...getReadOnlyAndRequired(),
        },
      };
      break;
    default:
      defaultValue = {
        brick: "forms.general-input",
        properties: {
          ...commonProps,
          ...getReadOnlyAndRequired(),
          placeholder: field.description,
        },
      };
  }
  return defaultValue;
}
