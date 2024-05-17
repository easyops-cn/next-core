import {
  collectContract,
  getContract,
  collectWidgetContract,
  clearCollectWidgetContract,
  collectDebugContract,
  clearDebugContract,
} from "./CollectContracts";

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

  it("should work with widget", () => {
    const contracts = [
      {
        namespaceId: "easyops.api.cmdb.model",
        name: "getDetail",
        version: "1.0.0",
      },
      {
        namespaceId: "easyops.api.cmdb.model",
        name: "postSearch",
        version: "1.2.0",
      },
    ];
    collectWidgetContract(contracts);

    expect(getContract("easyops.api.cmdb.model.postSearch")).toEqual({
      namespaceId: "easyops.api.cmdb.model",
      name: "postSearch",
      version: "1.2.0",
    });

    clearCollectWidgetContract();

    expect(getContract("easyops.api.cmdb.model.postSearch")).toEqual(undefined);
  });

  it("should work with debug mode", () => {
    const contracts = [
      {
        namespaceId: "easyops.api.cmdb.model",
        name: "getDetail",
        version: "1.0.0",
      },
      {
        namespaceId: "easyops.api.cmdb.model",
        name: "postSearch",
        version: "1.2.0",
      },
    ];
    collectDebugContract(contracts);

    expect(getContract("easyops.api.cmdb.model.postSearch")).toEqual({
      namespaceId: "easyops.api.cmdb.model",
      name: "postSearch",
      version: "1.2.0",
    });

    clearDebugContract();

    expect(getContract("easyops.api.cmdb.model.postSearch")).toEqual(undefined);
  });
});
