import { collectContract, getContract } from "./CollectContracts";

describe("CollectContract", () => {
  it("should work", () => {
    const contracts = [
      {
        namespaceId: "easyops.api.test.model",
        name: "a",
        version: "1.0.0",
      },
      {
        namespaceId: "easyops.api.test.model",
        name: "b",
        version: "1.2.0",
      },
    ];

    collectContract(contracts);

    expect(getContract("easyops.api.test.model.a")).toEqual({
      namespaceId: "easyops.api.test.model",
      name: "a",
      version: "1.0.0",
    });
  });
});
