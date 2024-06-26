import { jest, describe, it, expect } from "@jest/globals";
import * as apiGatewaySdk from "@next-api-sdk/api-gateway-sdk";
import { isFlowApiProvider, getArgsOfFlowApi } from "./FlowApi.js";
import * as CollectContract from "./CollectContracts.js";

jest.spyOn(CollectContract, "getContract").mockImplementation((key) => {
  switch (key) {
    case "easyops.api.test.GetDetail":
      return {
        name: "GetDetail",
        namespaceId: "easyops.api.test",
        serviceName: "cmdb.logic",
        endpoint: {
          uri: "/api/cmdb",
          method: "get",
        },
        version: "1.0.0",
        response: {
          wrapper: false,
        },
      };
    case "easyops.api.api_gateway.CheckLogin":
      return {
        name: "CheckLogin",
        namespaceId: "easyops.api.api_gateway",
        serviceName: "logic.api.gateway",
        endpoint: {
          uri: "/api/checkLogin",
          method: "get",
        },
        version: "1.0.0",
        response: {
          wrapper: false,
        },
      };
  }
});

jest.mock("@next-api-sdk/api-gateway-sdk");

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
              method: "LIST",
              uri: "/a/b/c/:objectId",
            },
            instanceId: "abcdefg",
            name: "TestMock",
            namespaceId: "easyops.api.test.sailor",
            namespace: [{ name: "easyops.api.test.sailor" }],
            // version: "1.0.0",
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
      case "easyops.custom_api.noUri":
        return {
          contractData: {},
        };
    }
  });

describe("FlowApi", () => {
  it("isCustomApiProvider should work", () => {
    expect(isFlowApiProvider("easyops.custom_api@myAwesomeApi")).toBe(true);
    expect(isFlowApiProvider("easyops.custom_api@myAwesomeApi:1.0.0")).toBe(
      true
    );
    expect(isFlowApiProvider("normal.provider")).toBe(false);
  });

  it("getArgsOfCustomApi should work", async () => {
    expect(
      await getArgsOfFlowApi("easyops.custom_api@getStatus:1.0.0", [])
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
      await getArgsOfFlowApi(
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
      await getArgsOfFlowApi("easyops.custom_api@exportMarkdown:1.0.0", ["123"])
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
      await getArgsOfFlowApi("easyops.custom_api@TestMock:1.0.0", ["object-1"])
    ).toEqual([
      {
        method: "get",
        responseWrapper: true,
        url: "api/gateway/api_service.easyops.api.test.sailor.TestMock/a/b/c/object-1",
        originalUri: "/a/b/c/:objectId",
        isFileType: false,
      },
    ]);

    expect(
      await getArgsOfFlowApi("easyops.api.test@GetDetail:1.0.0", ["APP"])
    ).toEqual([
      {
        ext_fields: undefined,
        method: "get",
        responseWrapper: false,
        url: "api/gateway/cmdb.logic/api/cmdb",
        originalUri: "/api/cmdb",
        isFileType: false,
      },
      "APP",
    ]);

    expect(
      await getArgsOfFlowApi("easyops.api.api_gateway@CheckLogin:1.0.0", [])
    ).toEqual([
      {
        ext_fields: undefined,
        method: "get",
        responseWrapper: false,
        url: "api/checkLogin",
        originalUri: "/api/checkLogin",
        isFileType: false,
      },
    ]);
  });

  it("getArgsOfCustomApi should throw error for legacy custom API", async () => {
    await expect(() =>
      getArgsOfFlowApi("easyops.custom_api@notFoundApi", [])
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"You're using legacy Custom API "easyops.custom_api@notFoundApi" which is dropped in v3, please use Flow API instead"`
    );
  });

  it("getArgsOfCustomApi should throw error if API not found", async () => {
    await expect(() =>
      getArgsOfFlowApi("easyops.custom_api@noneMock:1.0.0", [])
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Flow API not found: "easyops.custom_api@noneMock:1.0.0""`
    );
  });

  it("getArgsOfCustomApi should throw error if no uri", async () => {
    await expect(() =>
      getArgsOfFlowApi("easyops.custom_api@noUri:1.0.0", [])
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Missing endpoint.uri in contract of provider "easyops.custom_api@noUri:1.0.0""`
    );
  });
});
