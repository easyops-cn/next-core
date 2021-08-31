import * as cmdbSdk from "@next-sdk/cmdb-sdk";
import { isCustomApiProvider, getArgsOfCustomApi } from "./FlowApi";
import * as runtime from "./Runtime";

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
  .spyOn(cmdbSdk, "InstanceApi_postSearch")
  .mockImplementation((objectId, params) => {
    switch (params.query.name) {
      case "getStatus":
        return {
          list: [
            {
              name: "getStatus",
              version: "1.0.0",
              endpoint: {
                method: "get",
                uri: "/api/status",
              },
              namespace: [{ name: "easyops.custom_api" }],
            },
          ],
        } as any;
      case "exportMarkdown":
        return {
          list: [
            {
              name: "exportMarkdown",
              version: "1.0.0",
              endpoint: {
                method: "get",
                uri: "/api/export",
              },
              response: {
                type: "file",
              },
              namespace: [{ name: "easyops.custom_api" }],
            },
          ],
        } as any;
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
      await getArgsOfCustomApi("easyops.custom_api@myAwesomeApi", [
        "myObjectId",
        { fields: { "*": true } },
      ])
    ).toEqual([
      {
        url: "api/gateway/api_service.easyops.custom_api.myAwesomeApi/object/myObjectId/instance/_search",
        method: "POST",
        responseWrapper: true,
      },
      { fields: { "*": true } },
    ]);

    expect(
      await getArgsOfCustomApi("easyops.custom_api@apiListMethod", [])
    ).toEqual([
      {
        url: "api/gateway/api_service.easyops.custom_api.apiListMethod/list",
        method: "get",
        responseWrapper: false,
      },
    ]);

    expect(await getArgsOfCustomApi("easyops.custom_api@test", [])).toEqual([
      {
        url: "api/gateway/api_service.easyops.custom_api.test/api/test",
        method: "get",
        responseWrapper: true,
      },
    ]);

    expect(
      await getArgsOfCustomApi("easyops.custom_api@getStatus:1.0.0", [])
    ).toEqual([
      {
        url: "api/gateway/easyops.custom_api.getStatus@1.0.0/api/status",
        method: "get",
        responseWrapper: false,
      },
    ]);

    expect(
      await getArgsOfCustomApi("easyops.custom_api@exportMarkdown:1.0.0", [
        "test.md",
        { content: "hello world" },
      ])
    ).toEqual([
      "test.md",
      {
        url: "api/gateway/easyops.custom_api.exportMarkdown@1.0.0/api/export",
        method: "get",
        responseWrapper: false,
      },
      { content: "hello world" },
      { responseType: "blob" },
    ]);
  });

  it("getArgsOfCustomApi should throw error", async () => {
    await expect(() =>
      getArgsOfCustomApi("easyops.custom_api@notFoundApi", [])
    ).rejects.toThrow(
      new Error('Legacy Custom API not found: "easyops.custom_api@notFoundApi"')
    );

    await expect(() =>
      getArgsOfCustomApi("easyops.custom_api@apiWithoutMethodAndUri", [])
    ).rejects.toThrow(
      new Error(
        'Missing endpoint.uri in contract of provider "easyops.custom_api@apiWithoutMethodAndUri"'
      )
    );
  });
});
