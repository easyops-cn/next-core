import { Contract } from "@next-core/types";
import {
  collectContract,
  getContract,
  collectWidgetContract,
  clearCollectWidgetContract,
} from "./CollectContracts.js";

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
    ] as Contract[];

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
    ] as Contract[];
    collectWidgetContract(contracts);

    expect(getContract("easyops.api.cmdb.model.postSearch")).toEqual({
      namespaceId: "easyops.api.cmdb.model",
      name: "postSearch",
      version: "1.2.0",
    });

    clearCollectWidgetContract();

    expect(getContract("easyops.api.cmdb.model.postSearch")).toEqual(undefined);
  });
});
