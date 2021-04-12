import path from "path";
import { getContractDepsByBrick } from ".";

const mockConsoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => void 0);

describe("getContractDepsByBrick", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should work", () => {
    const contracts = getContractDepsByBrick(path.join(__dirname, ".."), {
      "contract-analysis.provider-fixture-a": "fixtures/FixtureA.tsx",
      "contract-analysis.provider-fixture-b": "fixtures/FixtureB.tsx",
    });
    expect(contracts).toEqual(
      new Map([
        [
          "contract-analysis.provider-fixture-a",
          [
            "easyops.api.api_gateway.bootstrap.Bootstrap",
            "easyops.api.cmdb.cmdb_object.GetDetail",
            "easyops.api.cmdb.instance.PostSearchV3",
          ],
        ],
        [
          "contract-analysis.provider-fixture-b",
          ["easyops.api.cmdb.instance.PostSearchV3"],
        ],
      ])
    );
  });

  it("should throw if parse failed", () => {
    expect(() => {
      getContractDepsByBrick(path.join(__dirname, ".."), {
        "contract-analysis.provider-fixture-x": "fixtures/FixtureX.ts",
      });
    }).toThrowError();
    expect(mockConsoleError).toBeCalledWith(
      expect.stringContaining("Failed to parse")
    );
  });

  it("should log errors if resolve failed", () => {
    const contracts = getContractDepsByBrick(path.join(__dirname, ".."), {
      "contract-analysis.provider-fixture-y": "fixtures/FixtureY.ts",
    });
    expect(contracts).toEqual(
      new Map([["contract-analysis.provider-fixture-y", []]])
    );
    expect(mockConsoleError).toBeCalledWith(
      expect.stringContaining("Failed to resolve")
    );
  });
});
