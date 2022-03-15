import { getArgsOfCustomApi } from "../../core/FlowApi";
import fetchProviderArgs from "./fetchProviderArgs";

const argsData = [
  {
    url: "api/gateway/api_service.easyops.custom_api.test/api/test",
    method: "get",
    responseWrapper: true,
  },
];
jest.mock("../../core/FlowApi", () => ({
  getArgsOfCustomApi: jest.fn().mockResolvedValue(argsData),
}));

describe("fetchProviderArgs", () => {
  it("should work", async () => {
    const result = await fetchProviderArgs("easyops.custom_api@test", []);

    expect(result).toEqual(argsData);
    expect(getArgsOfCustomApi).toBeCalledTimes(1);

    const res = await fetchProviderArgs("easyops.custom_api@test", []);
    expect(res).toEqual(argsData);
    expect(getArgsOfCustomApi).toBeCalledTimes(1);
  });
});
