import "@testing-library/jest-dom";
import { formRenderer } from "./constants";
import {
  ExpandCustomForm,
  getDefaultProperties,
  getStoryboard,
} from "./ExpandCustomForm";

describe("getDefaultProperties is work", () => {
  it("getDefaultProperties by ANY", () => {
    const result = getDefaultProperties("test", [
      {
        defaultValue: "0",
        description: "不允许特殊字符",
        fieldId: "test",
        limit: ["REQUIRED"],
        name: "用户名",
        fieldType: "ANY",
      },
    ]);
    expect(result).toEqual({
      brick: "forms.general-input",
      properties: {
        dataset: {
          testid: "test",
        },
        id: "test",
        label: "用户名",
        name: "test",
        placeholder: "不允许特殊字符",
        readOnly: false,
        required: true,
      },
    });
  });
  it("getDefaultProperties by STRING", () => {
    const result = getDefaultProperties("test", [
      {
        defaultValue: "0",
        description: "不允许特殊字符",
        fieldId: "test",
        limit: ["REQUIRED"],
        name: "用户名",
        fieldType: "STRING",
      },
    ]);
    expect(result).toEqual({
      brick: "forms.general-input",
      properties: {
        dataset: {
          testid: "test",
        },
        id: "test",
        label: "用户名",
        name: "test",
        placeholder: "不允许特殊字符",
        readOnly: false,
        required: true,
      },
    });
  });

  it("getDefaultProperties by INT", () => {
    const result = getDefaultProperties("test", [
      {
        defaultValue: "0",
        description: "不允许特殊字符",
        fieldId: "test",
        limit: ["REQUIRED"],
        name: "用户名",
        fieldType: "INT",
      },
    ]);
    expect(result).toEqual({
      brick: "forms.general-input-number",
      properties: {
        dataset: {
          testid: "test",
        },
        id: "test",
        inputBoxStyle: { width: "100%" },
        label: "用户名",
        name: "test",
        placeholder: "不允许特殊字符",
        precision: 0,
        readOnly: false,
        required: true,
      },
    });
  });

  it("getDefaultProperties by BOOLEAN", () => {
    const result = getDefaultProperties("test", [
      {
        defaultValue: "0",
        description: "不允许特殊字符",
        fieldId: "test",
        limit: ["REQUIRED"],
        name: "用户名",
        fieldType: "BOOLEAN",
      },
    ]);
    expect(result).toEqual({
      brick: "forms.general-switch",
      properties: {
        dataset: {
          testid: "test",
        },
        id: "test",
        label: "用户名",
        name: "test",
        readOnly: false,
        required: true,
      },
    });
  });

  it("getDefaultProperties by FLOAT", () => {
    const result = getDefaultProperties("test", [
      {
        defaultValue: "0",
        description: "不允许特殊字符",
        fieldId: "test",
        limit: ["REQUIRED"],
        name: "用户名",
        fieldType: "FLOAT",
      },
    ]);
    expect(result).toEqual({
      brick: "forms.general-input-number",
      properties: {
        dataset: {
          testid: "test",
        },
        id: "test",
        inputBoxStyle: { width: "100%" },
        label: "用户名",
        name: "test",
        placeholder: "不允许特殊字符",
        readOnly: false,
        required: true,
      },
    });
  });

  it("getDefaultProperties by ENUM", () => {
    const result = getDefaultProperties("test", [
      {
        defaultValue: "0",
        description: "不允许特殊字符",
        fieldId: "test",
        limit: ["REQUIRED"],
        name: "用户名",
        fieldType: "ENUM",
      },
    ]);
    expect(result).toEqual({
      brick: "forms.general-select",
      properties: {
        dataset: {
          testid: "test",
        },
        id: "test",
        inputBoxStyle: { width: "100%" },
        label: "用户名",
        name: "test",
        options: [
          { label: "选项一", value: 1 },
          { label: "选项二", value: 2 },
        ],
        placeholder: "不允许特殊字符",
        readOnly: false,
        required: true,
      },
    });
  });

  it("getDefaultProperties by ENUMS", () => {
    const result = getDefaultProperties("test", [
      {
        defaultValue: "0",
        description: "不允许特殊字符",
        fieldId: "test",
        limit: ["REQUIRED"],
        name: "用户名",
        fieldType: "ENUMS",
      },
    ]);
    expect(result).toEqual({
      brick: "forms.general-select",
      properties: {
        dataset: {
          testid: "test",
        },
        id: "test",
        inputBoxStyle: { width: "100%" },
        label: "用户名",
        mode: "multiple",
        name: "test",
        options: [
          { label: "选项一", value: 1 },
          { label: "选项二", value: 2 },
        ],
        placeholder: "不允许特殊字符",
        readOnly: false,
        required: true,
      },
    });
  });

  it("getDefaultProperties by DATE", () => {
    const result = getDefaultProperties("test", [
      {
        defaultValue: "0",
        description: "不允许特殊字符",
        fieldId: "test",
        limit: ["REQUIRED"],
        name: "用户名",
        fieldType: "DATE",
      },
    ]);
    expect(result).toEqual({
      brick: "forms.general-date-picker",
      properties: {
        dataset: {
          testid: "test",
        },
        id: "test",
        label: "用户名",
        name: "test",
        placeholder: "不允许特殊字符",
        readOnly: false,
        required: true,
      },
    });
  });

  it("getDefaultProperties by TIME", () => {
    const result = getDefaultProperties("test", [
      {
        defaultValue: "0",
        description: "不允许特殊字符",
        fieldId: "test",
        limit: ["REQUIRED"],
        name: "用户名",
        fieldType: "TIME",
      },
    ]);
    expect(result).toEqual({
      brick: "forms.general-date-picker",
      properties: {
        dataset: {
          testid: "test",
        },
        id: "test",
        label: "用户名",
        name: "test",
        placeholder: "不允许特殊字符",
        readOnly: false,
        required: true,
      },
    });
  });

  it("getDefaultProperties by IP", () => {
    const result = getDefaultProperties("test", [
      {
        defaultValue: "0",
        description: "不允许特殊字符",
        fieldId: "test",
        limit: ["REQUIRED"],
        name: "用户名",
        fieldType: "IP",
      },
    ]);
    /* eslint-disable */
    expect(result).toEqual({
      brick: "forms.general-input",
      properties: {
        dataset: {
          testid: "test",
        },
        id: "test",
        label: "用户名",
        name: "test",
        pattern:
          "((^s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))s*$)|(^s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:)))(%.+)?s*$))",
        message: {
          pattern: "输入字符不匹配IP格式",
        },
        placeholder: "不允许特殊字符",
        readOnly: false,
        required: true,
      },
    });
    /* eslint-disable */
  });

  it("getDefaultProperties by JSON", () => {
    const result = getDefaultProperties("test", [
      {
        defaultValue: "0",
        description: "不允许特殊字符",
        fieldId: "test",
        limit: ["REQUIRED"],
        name: "用户名",
        fieldType: "JSON",
      },
    ]);
    expect(result).toEqual({
      brick: "forms.general-textarea",
      properties: {
        dataset: {
          testid: "test",
        },
        id: "test",
        label: "用户名",
        name: "test",
      },
    });
  });

  it("getDefaultProperties by ARRAY", () => {
    const result = getDefaultProperties("test", [
      {
        defaultValue: "0",
        description: "不允许特殊字符",
        fieldId: "test",
        limit: ["REQUIRED"],
        name: "用户名",
        fieldType: "ARRAY",
      },
    ]);
    expect(result).toEqual({
      brick: "forms.general-select",
      properties: {
        dataset: {
          testid: "test",
        },
        id: "test",
        label: "用户名",
        name: "test",
      },
    });
  });

  it("getDefaultProperties by STRUCTURE", () => {
    const result = getDefaultProperties("test", [
      {
        defaultValue: "0",
        description: "不允许特殊字符",
        fieldId: "test",
        limit: ["REQUIRED"],
        name: "用户名",
        fieldType: "STRUCTURE",
      },
    ]);
    expect(result).toEqual({
      brick: "forms.cmdb-instance-select-panel",
      properties: {
        dataset: {
          testid: "test",
        },
        id: "test",
        label: "用户名",
        name: "test",
        readOnly: false,
        required: true,
      },
    });
  });

  it("getDefaultProperties by STRUCTURE_ARRAY", () => {
    const result = getDefaultProperties("test", [
      {
        defaultValue: "0",
        description: "不允许特殊字符",
        fieldId: "test",
        limit: ["REQUIRED"],
        name: "用户名",
        fieldType: "STRUCTURE_ARRAY",
      },
    ]);
    expect(result).toEqual({
      brick: "forms.cmdb-instance-select-panel",
      properties: {
        dataset: {
          testid: "test",
        },
        id: "test",
        label: "用户名",
        name: "test",
        readOnly: false,
        required: true,
      },
    });
  });

  it("getDefaultProperties by field not find", () => {
    const result = getDefaultProperties("test", [
      {
        defaultValue: "0",
        description: "不允许特殊字符",
        fieldId: "test123",
        limit: ["REQUIRED"],
        name: "用户名",
        fieldType: "input",
      },
    ]);
    expect(result).toEqual({});
  });
});

describe("ExpandCustomForm is work", () => {
  const formData = {
    formSchema: {
      brick: "forms.general-form",
      context: {},
      properties: {
        formItemConfig: {},
        id: "form_137",
        sectionConfig: {},
        values: {},
      },
      bricks: [
        {
          brick: "basic-bricks.grid-layout",
          instanceId: "123",
          mountPoint: "items",
          properties: {
            columns: 1,
            id: "grid_138",
            title: "行容器",
          },
          bricks: [
            {
              id: "userName",
              mountPoint: "items",
              properties: {
                id: "userName",
                name: "userName",
                label: "用户名",
                readOnly: true,
                required: true,
                placeholder: "不允许特殊字符",
              },
              if: "",
            },
            {
              id: "userId",
              mountPoint: "items",
              brick: "forms.general-input",
              properties: {
                id: "userId",
                name: "userId",
                label: "ID",
                readOnly: false,
                required: false,
                placeholder: "不允许特殊字符",
              },
            },
            {
              id: "age",
              mountPoint: "items",
              brick: "forms.general-input-number",
              properties: {
                id: "age",
                name: "age",
                label: "年龄",
                readOnly: false,
                required: false,
                placeholder: "不允许特殊字符",
                precision: 0,
                inputBoxStyle: {
                  width: "100%",
                },
              },
            },
            {
              id: "department",
              mountPoint: "items",
              brick: "forms.general-select",
              properties: {
                id: "department",
                name: "department",
                label: "部门",
                readOnly: false,
                required: true,
                options: [
                  {
                    label: "选项一",
                    value: 1,
                  },
                  {
                    label: "选项二",
                    value: 2,
                  },
                ],
                placeholder: "不允许特殊字符",
                inputBoxStyle: {
                  width: "100%",
                },
              },
            },
            {
              id: "status",
              mountPoint: "items",
              brick: "forms.general-select",
              properties: {
                id: "status",
                name: "status",
                label: "状态",
                readOnly: false,
                required: true,
                options: [
                  {
                    label: "选项一",
                    value: 1,
                  },
                  {
                    label: "选项二",
                    value: 2,
                  },
                ],
                inputBoxStyle: {
                  width: "100%",
                },
              },
            },
          ],
        },
      ],
    },
    fields: [
      {
        _object_id: "FORM_MODEL_FIELD@EASYOPS",
        _object_version: 13,
        _pre_ts: 1654587251,
        _ts: 1656341679,
        _version: 16,
        creator: "easyops",
        ctime: "2022-05-30 10:27:25",
        defaultValue: "0",
        deleteAuthorizers: [],
        description: "不允许特殊字符",
        fieldId: "userName",
        instanceId: "5e0316589e322",
        limit: ["READONLY", "UNIQUE", "REQUIRED"],
        modifier: "easyops",
        mtime: "2022-06-27 22:54:39",
        name: "用户名",
        org: 8888,
        readAuthorizers: [],
        fieldType: "STRING",
        updateAuthorizers: [],
      },
      {
        _object_id: "FORM_MODEL_FIELD@EASYOPS",
        _object_version: 13,
        _pre_ts: 1653899280,
        _ts: 1654584746,
        _version: 3,
        creator: "easyops",
        ctime: "2022-05-30 12:18:55",
        defaultValue: "0",
        deleteAuthorizers: [],
        description: "不允许特殊字符",
        fieldId: "userId",
        instanceId: "5e032f4514c7b",
        limit: [],
        modifier: "easyops",
        mtime: "2022-06-07 14:52:26",
        name: "用户Id",
        org: 8888,
        readAuthorizers: [],
        fieldType: "STRING",
        updateAuthorizers: [],
      },
      {
        _object_id: "FORM_MODEL_FIELD@EASYOPS",
        _object_version: 13,
        _pre_ts: 1654575830,
        _ts: 1654575843,
        _version: 5,
        creator: "easyops",
        ctime: "2022-05-31 16:16:10",
        defaultValue: "0",
        deleteAuthorizers: [],
        description: "不允许特殊字符",
        fieldId: "age",
        instanceId: "5e04a62a36373",
        limit: [],
        modifier: "easyops",
        mtime: "2022-06-07 12:24:03",
        name: "年龄",
        org: 8888,
        readAuthorizers: [],
        fieldType: "INT",
        updateAuthorizers: [],
      },
      {
        _object_id: "FORM_MODEL_FIELD@EASYOPS",
        _object_version: 13,
        _pre_ts: 1653985000,
        _ts: 1654574250,
        _version: 2,
        creator: "easyops",
        ctime: "2022-05-31 16:16:40",
        deleteAuthorizers: [],
        description: "不允许特殊字符",
        fieldId: "department",
        instanceId: "5e04a6469c232",
        limit: ["REQUIRED"],
        modifier: "easyops",
        mtime: "2022-06-07 11:57:30",
        name: "部门",
        org: 8888,
        readAuthorizers: [],
        fieldType: "ENUMERATED_SINGLE_OPTION",
        updateAuthorizers: [],
      },
      {
        _object_id: "FORM_MODEL_FIELD@EASYOPS",
        _object_version: 12,
        _ts: 1653985036,
        _version: 1,
        creator: "easyops",
        ctime: "2022-05-31 16:17:16",
        defaultValue: "在职",
        deleteAuthorizers: [],
        fieldId: "status",
        instanceId: "5e04a669508fb",
        limit: ["REQUIRED"],
        name: "状态",
        org: 8888,
        readAuthorizers: [],
        fieldType: "ENUMERATED_SINGLE_OPTION",
        updateAuthorizers: [],
      },
    ],
    context: [
      {
        name: "departmentOption",
        value: [
          {
            name: "web前端",
            value: "web",
          },
          {
            name: "管理层",
            value: "manager",
          },
        ],
      },
    ],
  };
  const _formData = {};
  const brickConf = {
    bg: false,
    brick: formRenderer,
    iid: "5e27819b1e711",
    injectDeep: true,
    portal: false,
    properties: {
      dataset: {
        testid: "test",
      },
      formData: "<% CTX.formData %>",
    },
  };
  expect(ExpandCustomForm(formData, brickConf, true)).toMatchSnapshot();
  expect(ExpandCustomForm(_formData, brickConf)).toEqual({
    brick: "div",
    slots: {
      "": {
        bricks: [
          {
            brick: "presentational-bricks.brick-illustration",
            properties: {
              category: "default",
              header: {
                title: "参数错误",
              },
              mode: "guide",
              name: "search-empty",
            },
          },
        ],
        type: "bricks",
      },
    },
  });
  expect(ExpandCustomForm(_formData, brickConf)).toEqual({
    brick: "div",
    slots: {
      "": {
        bricks: [
          {
            brick: "presentational-bricks.brick-illustration",
            properties: {
              category: "default",
              header: {
                title: "参数错误",
              },
              mode: "guide",
              name: "search-empty",
            },
          },
        ],
        type: "bricks",
      },
    },
  });
});
