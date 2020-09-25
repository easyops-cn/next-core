import { mockMicroAppApiOrchestrationMap } from "./__mocks__/MicroAppApiOrchestrationData";
import { isCustomApiProvider, getArgsOfCustomApi } from "./CustomApis";

describe("CustomApis", () => {
  it("isCustomApiProvider should work", () => {
    expect(isCustomApiProvider("easyops.custom_api@myAwesomeApi")).toBe(true);

    expect(isCustomApiProvider("normal.provider")).toBe(false);
  });

  it("getArgsOfCustomApi should work", () => {
    expect(
      getArgsOfCustomApi(
        "easyops.custom_api@myAwesomeApi",
        mockMicroAppApiOrchestrationMap,
        ["myObjectId", { fields: { "*": true } }]
      )
    ).toEqual([
      {
        url:
          "api/gateway/api_service.easyops.custom_api.myAwesomeApi/object/myObjectId/instance/_search",
        method: "POST",
        responseWrapper: true,
      },
      { fields: { "*": true } },
    ]);

    expect(
      getArgsOfCustomApi(
        "easyops.custom_api@apiListMethod",
        mockMicroAppApiOrchestrationMap,
        []
      )
    ).toEqual([
      {
        url: "api/gateway/api_service.easyops.custom_api.apiListMethod/list",
        method: "get",
        responseWrapper: false,
      },
    ]);

    expect(
      getArgsOfCustomApi(
        "easyops.custom_api@test",
        mockMicroAppApiOrchestrationMap,
        []
      )
    ).toEqual([
      {
        url: "api/gateway/api_service.easyops.custom_api.test/api/test",
        method: "get",
        responseWrapper: false,
      },
    ]);
  });

  it("getArgsOfCustomApi should throw error", () => {
    expect(() => {
      getArgsOfCustomApi(
        "easyops.custom_api@notFoundApi",
        mockMicroAppApiOrchestrationMap,
        []
      );
    }).toThrowError(
      'Custom API of "easyops.custom_api@notFoundApi" cannot be found,please make sure it exists and has been exported.'
    );

    expect(() => {
      getArgsOfCustomApi(
        "easyops.custom_api@apiWithoutMethodAndUri",
        mockMicroAppApiOrchestrationMap,
        []
      );
    }).toThrowError(
      'Please make sure the "${endpoint.uri}" field in contract of custom api "easyops.custom_api@apiWithoutMethodAndUri" is correctly set.'
    );
  });
});
