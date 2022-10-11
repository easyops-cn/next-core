import * as apiGatewaySdk from "@next-sdk/api-gateway-sdk";
import { isCustomApiProvider, getArgsOfCustomApi } from "./FlowApi";
import * as runtime from "./Runtime";
import * as mocks from "./MockRegistry";
import * as CollectContract from "./CollectContracts";

jest.spyOn(mocks, "getMockList").mockReturnValue([
  {
    uri: "/a/b/c/:objectId",
    provider: "easyops.custom_api@TestMock",
  },
  {
    uri: "/a/b/c/d",
    provider: "easyops.custom_api@noneMock",
  },
]);

jest.spyOn(CollectContract, "getContract").mockImplementation((key) => {
  if (key === "easyops.api.test.GetDetail")
    return {
      name: "GetDetail",
      namespaceId: "easyops.api.test",
      serviceName: "cmdb.loginc",
      endpoint: {
        uri: "/api/cmdb",
        method: "get",
      },
      version: "1.0.0",
      response: {
        wrapper: false,
      },
    };
});

jest
  .spyOn(runtime, "_internalApiGetMicroAppApiOrchestrationMap")
  .mockResolvedValue(
    new Map<string, any>([
      [
        "easyops.custom_api@myAwesomeApi",
        {
          contract: {
            endpoint: {
              method: "POST",
              uri: "/object/:objectId/instance/_search",
            },
            name: "myAwesomeApi",
            response: {
              fields: [
                {
                  description: "instance list",
                  name: "list",
                  type: "map[]",
                },
              ],
              type: "object",
            },
          },
          name: "myAwesomeApi",
          namespace: "easyops.custom_api",
        },
      ],
      [
        "easyops.custom_api@apiWithoutMethodAndUri",
        {
          contract: {
            name: "apiWithoutMethodAndUri",
          },
          name: "apiWithoutMethodAndUri",
          namespace: "easyops.custom_api",
        },
      ],
      [
        "easyops.custom_api@apiListMethod",
        {
          contract: {
            endpoint: {
              method: "list",
              uri: "/list",
            },
            name: "apiListMethod",
          },
          name: "apiListMethod",
          namespace: "easyops.custom_api",
        },
      ],
      [
        "easyops.custom_api@test",
        {
          contract: `
        endpoint:
          method: get
          uri: '/api/test'
        response: '~'
        name: test`,
          name: "test",
          namespace: "easyops.custom_api",
        },
      ],
    ])
  );

jest
  .spyOn(apiGatewaySdk, "ContractApi_searchSingleContract")
  .mockImplementation((params) => {
    switch (params.contractName) {
      case "easyops.custom_api.getStatus":
        return {
          contractData: {
            name: "getStatus",
            version: "1.0.0",
            endpoint: {
              method: "get",
              uri: "/api/status",
            },
            namespace: [{ name: "easyops.custom_api" }],
          },
        } as any;
      case "easyops.custom_api.exportMarkdown":
        return {
          contractData: {
            name: "exportMarkdown",
            version: "1.0.0",
            endpoint: {
              method: "get",
              uri: "/api/export/:id",
            },
            request: {
              type: "object",
              fields: [
                {
                  description: "id",
                  name: "id",
                  type: "string",
                },
              ],
            },
            response: {
              type: "file",
            },
            namespace: [{ name: "easyops.custom_api" }],
          },
        } as any;
      case "easyops.custom_api.TestMock":
        return {
          contractData: {
            endpoint: {
              method: "GET",
              uri: "/a/b/c/:objectId",
            },
            instanceId: "abcdefg",
            name: "TestMock",
            namespaceId: "easyops.api.test.sailor",
            namespace: [{ name: "easyops.api.test.sailor" }],
            version: "1.0.0",
            response: {
              default: {},
              description: "tt",
              fields: [
                {
                  description: "tt",
                  name: "data",
                  type: "map",
                },
              ],
              required: [],
              type: "object",
            },
          },
        };
      case "easyops.custom_api.noneMock":
        return {};
      case "invalid.export_api":
        return {};
    }
  });

describe("FlowApi", () => {
  it("isCustomApiProvider should work", () => {
    expect(isCustomApiProvider("easyops.custom_api@myAwesomeApi")).toBe(true);
    expect(isCustomApiProvider("easyops.custom_api@myAwesomeApi:1.0.0")).toBe(
      true
    );
    expect(isCustomApiProvider("normal.provider")).toBe(false);
  });

  it("getArgsOfCustomApi should work", async () => {
    expect(
      await getArgsOfCustomApi("cmdb.provider", [
        "myObjectId",
        { fields: { "*": true } },
      ])
    ).toEqual(["myObjectId", { fields: { "*": true } }]);
    expect(
      await getArgsOfCustomApi("easyops.custom_api@myAwesomeApi", [
        "myObjectId",
        { fields: { "*": true } },
      ])
    ).toEqual([
      {
        url: "api/gateway/api_service.easyops.custom_api.myAwesomeApi/object/myObjectId/instance/_search",
        originalUri: "/object/:objectId/instance/_search",
        method: "POST",
        responseWrapper: true,
        isFileType: false,
      },
      { fields: { "*": true } },
    ]);

    expect(
      await getArgsOfCustomApi("easyops.custom_api@apiListMethod", [])
    ).toEqual([
      {
        url: "api/gateway/api_service.easyops.custom_api.apiListMethod/list",
        originalUri: "/list",
        method: "get",
        responseWrapper: false,
        isFileType: false,
      },
    ]);

    expect(await getArgsOfCustomApi("easyops.custom_api@test", [])).toEqual([
      {
        url: "api/gateway/api_service.easyops.custom_api.test/api/test",
        originalUri: "/api/test",
        method: "get",
        responseWrapper: true,
        isFileType: false,
      },
    ]);

    expect(
      await getArgsOfCustomApi("easyops.custom_api@getStatus:1.0.0", [])
    ).toEqual([
      {
        url: "api/gateway/easyops.custom_api.getStatus@1.0.0/api/status",
        originalUri: "/api/status",
        method: "get",
        responseWrapper: false,
        isFileType: false,
      },
    ]);

    expect(
      await getArgsOfCustomApi(
        "easyops.custom_api@exportMarkdown:1.0.0",
        ["test.md", "123"],
        "saveAs"
      )
    ).toEqual([
      "test.md",
      {
        url: "api/gateway/easyops.custom_api.exportMarkdown@1.0.0/api/export/123",
        originalUri: "/api/export/:id",
        method: "get",
        request: {
          fields: [
            {
              description: "id",
              name: "id",
              type: "string",
            },
          ],
          type: "object",
        },
        responseWrapper: true,
        isFileType: true,
      },
    ]);

    expect(
      await getArgsOfCustomApi("easyops.custom_api@exportMarkdown:1.0.0", [
        "123",
      ])
    ).toEqual([
      {
        url: "api/gateway/easyops.custom_api.exportMarkdown@1.0.0/api/export/123",
        originalUri: "/api/export/:id",
        method: "get",
        request: {
          fields: [
            {
              description: "id",
              name: "id",
              type: "string",
            },
          ],
          type: "object",
        },
        responseWrapper: true,
        isFileType: true,
      },
    ]);

    expect(
      await getArgsOfCustomApi("easyops.custom_api@TestMock:1.0.0", [
        "object-1",
      ])
    ).toEqual([
      {
        method: "GET",
        responseWrapper: true,
        url: "api/gateway/easyops.api.test.sailor.TestMock@1.0.0/a/b/c/object-1",
        originalUri: "/a/b/c/:objectId",
        isFileType: false,
      },
    ]);

    expect(
      await getArgsOfCustomApi("easyops.api.test@GetDetail:1.0.0", ["APP"])
    ).toEqual([
      {
        ext_fields: undefined,
        method: "get",
        responseWrapper: false,
        url: "api/gateway/cmdb.loginc/api/cmdb",
        originalUri: "/api/cmdb",
        isFileType: false,
      },
      "APP",
    ]);
  });

  it("getArgsOfCustomApi should throw error", async () => {
    await expect(() =>
      getArgsOfCustomApi("easyops.custom_api@notFoundApi", [])
    ).rejects.toThrow(
      new Error('Legacy Custom API not found: "easyops.custom_api@notFoundApi"')
    );

    await expect(() =>
      getArgsOfCustomApi("easyops.custom_api@noneMock:1.0.0", [])
    ).rejects.toThrow(
      new Error('Flow API not found: "easyops.custom_api@noneMock:1.0.0"')
    );

    await expect(() =>
      getArgsOfCustomApi("easyops.custom_api@apiWithoutMethodAndUri", [])
    ).rejects.toThrow(
      new Error(
        'Missing endpoint.uri in contract of provider "easyops.custom_api@apiWithoutMethodAndUri"'
      )
    );

    await expect(() =>
      getArgsOfCustomApi("invalid@export_api:1.0.0", [])
    ).rejects.toThrow('Flow API not found: "invalid@export_api:1.0.0"');
  });
});
