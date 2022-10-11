import { ContractRequest, ExtField } from "@next-core/brick-types";
import {
  CustomApi,
  CustomApiParams,
  processExtFields,
  hasFileType,
  transformFormData,
} from "./CustomApi";
import { http } from "@next-core/brick-http";

jest.mock("@next-core/brick-http", () => ({
  http: {
    simpleRequest: jest
      .fn()
      .mockResolvedValue({ data: "simpleRequest resolved" }),
    requestWithBody: jest
      .fn()
      .mockResolvedValue({ data: "requestWithBody resolved" }),
  },
}));

const mockedSimpleRequest = http.simpleRequest as jest.Mock;
const mockedRequestWithBody = http.requestWithBody as jest.Mock;

describe("CustomApi", () => {
  it.each<[CustomApiParams, any, any, any, any]>([
    [
      {
        url: "/xxx",
        method: "get",
        responseWrapper: true,
      },
      { a: 1 } as any,
      undefined,
      "simpleRequest resolved",
      ["get", "/xxx", { params: { a: 1 } }],
    ],
    [
      {
        url: "/xxx",
      },
      { a: 1 } as any,
      undefined,
      "simpleRequest resolved",
      ["GET", "/xxx", { params: { a: 1 } }],
    ],
    [
      {
        url: "/xxx",
        responseWrapper: false,
      },
      { a: 1 } as any,
      undefined,
      { data: "simpleRequest resolved" },
      ["GET", "/xxx", { params: { a: 1 } }],
    ],
    [
      {
        url: "/xxx/111",
        originalUri: "/xxx/:id",
        method: "get",
        responseWrapper: false,
        request: {
          type: "object",
          fields: [
            {
              name: "id",
              type: "string",
              description: "",
            },
          ],
        },
        isFileType: true,
      },
      undefined,
      undefined,
      { data: "simpleRequest resolved" },
      ["get", "/xxx/111", { responseType: "blob" }],
    ],
  ])(
    "CustomApi(%j) simple request should work",
    async (params1, params2, params3, result, simpleRequestArgs) => {
      expect(await CustomApi(params1, params2, params3)).toEqual(result);
      expect(mockedSimpleRequest).toBeCalledWith(...simpleRequestArgs);
    }
  );

  it.each<[CustomApiParams, any, any, any, any]>([
    [
      {
        url: "/xxx",
        method: "post",
        responseWrapper: false,
      },
      { a: 1 } as any,
      undefined,
      { data: "requestWithBody resolved" },
      ["post", "/xxx", { a: 1 }, {}],
    ],
    [
      {
        url: "/xxx",
        method: "post",
        responseWrapper: true,
      },
      { a: 1 } as any,
      { headers: new Headers({ "x-requested-with": "XMLHttpRequest" }) } as any,
      "requestWithBody resolved",
      ["post", "/xxx", { a: 1 }, { headers: expect.any(Headers) }],
    ],
    [
      {
        url: "/xxx",
        method: "post",
        responseWrapper: true,
        request: {
          type: "object",
          fields: [
            {
              name: "file",
              type: "file",
              description: "",
            },
          ],
        },
      },
      {
        file: new File(["foo"], "foo.txt", {
          type: "text/plain",
        }),
        key: ["id1", "id2"],
      } as any,
      undefined,
      "requestWithBody resolved",
      ["post", "/xxx", expect.any(FormData), {}],
    ],
    [
      {
        url: "/xxx/123",
        originalUri: "/xxx/:id",
        method: "post",
        responseWrapper: true,
        request: {
          type: "object",
          fields: [
            {
              name: "id",
              type: "string",
              description: "",
            },
          ],
        },
        isFileType: true,
      },
      undefined,
      undefined,
      { data: "requestWithBody resolved" },
      ["post", "/xxx/123", undefined, { responseType: "blob" }],
    ],
  ])(
    "CustomApi(%j) not simple request should work",
    async (params1, params2, params3, result, requestWithBodyArgs) => {
      expect(await CustomApi(params1, params2, params3)).toEqual(result);
      expect(mockedRequestWithBody).toBeCalledWith(...requestWithBodyArgs);
    }
  );

  it.each([
    [
      [
        {
          name: "page",
          source: "query",
        },
      ],
      {
        page: 1,
      },
      undefined,
      {
        data: {},
        options: {
          params: {
            page: 1,
          },
        },
      },
    ],
    [
      [
        {
          name: "page",
          source: "query",
        },
        {
          name: "instance",
          source: "body",
        },
      ],
      {
        instance: {
          name: "test",
          instanceId: "bacd2",
        },
      },
      {
        page: 1,
      },
      {
        data: { instance: { instanceId: "bacd2", name: "test" } },
        options: { params: { page: 1 } },
      },
    ],
    [
      [
        {
          name: "instance",
          type: "object",
        },
      ],
      {
        instance: {
          name: "test",
          instanceId: "bacd2",
        },
      },
      {
        interceptorParams: { ignoreLoadingBar: true },
      },
      {
        data: { instance: { instanceId: "bacd2", name: "test" } },
        options: { interceptorParams: { ignoreLoadingBar: true } },
      },
    ],
  ])(
    "processExtFields(%j) should work",
    (params1, params2, params3, result) => {
      expect(processExtFields(params1 as ExtField[], params2, params3)).toEqual(
        result
      );
    }
  );

  it.each([
    [null, false],
    [
      {
        type: "object",
        fields: [
          {
            name: "name",
            type: "string",
          },
          {
            name: "age",
            type: "number",
          },
        ],
      },
      false,
    ],
    [
      {
        type: "object",
        fields: [
          {
            name: "name",
            type: "string",
          },
          {
            name: "age",
            type: "number",
          },
          {
            name: "file",
            type: "file[]",
          },
        ],
      },
      true,
    ],
    [
      {
        type: "object",
        fields: [
          {
            ref: "instanceData.name",
          },
          {
            name: "age",
            type: "number",
          },
          {
            name: "plugin",
            type: "object",
            fields: [
              {
                name: "data",
                type: "object",
                fields: [
                  {
                    name: "file",
                    type: "file",
                  },
                ],
              },
              {
                ref: "instance.*",
              },
            ],
          },
        ],
      },
      true,
    ],
    [
      {
        type: "object",
        fields: [
          {
            ref: "instanceData.name",
          },
          {
            name: "age",
            type: "number",
          },
          {
            name: "plugin",
            type: "object",
            fields: [
              {
                name: "data",
                type: "object",
                fields: [
                  {
                    name: "instance",
                    type: "object",
                    fields: [
                      {
                        name: "id",
                        type: "string",
                      },
                      {
                        name: "model",
                        type: "modelData",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      false,
    ],
  ])("hasFileType(%j) should work", (response, result) => {
    expect(hasFileType(response as ContractRequest)).toEqual(result);
  });

  it("transformFormData should work", () => {
    const formData = new FormData();
    formData.append("name", "tester");

    expect(transformFormData(formData)).toEqual(formData);

    const result = transformFormData({
      env: {
        ip: "192.168.100.162",
        instanceId: "abc53",
      },
    });
    expect(result.get("env[ip]")).toEqual("192.168.100.162");
    expect(result.get("env[instanceId]")).toEqual("abc53");

    const result2 = transformFormData({
      ids: ["abc", "ba3", "cd5"],
    });
    expect(result2.getAll("ids")).toEqual(["abc", "ba3", "cd5"]);
  });
});
