import { jest } from "@jest/globals";
import {
  legacyTransformProperties,
  legacyTransformIntermediateData,
} from "./legacy_transform.js";
import { getV2RuntimeFromDll } from "../getV2RuntimeFromDll.js";
import * as runtimeModule from "./Runtime.js";

// Mock dependencies
jest.mock("../getV2RuntimeFromDll.js");
jest.mock("./Runtime.js");

describe("legacyTransformProperties", () => {
  beforeEach(() => {
    (getV2RuntimeFromDll as jest.Mock).mockReturnValue(null);
    (runtimeModule._internalApiGetRuntimeContext as jest.Mock).mockReturnValue(
      {}
    );
  });

  it("should throw error when options are provided in v3", () => {
    expect(() => {
      legacyTransformProperties({}, {}, "targetProp", undefined, undefined, {
        someOption: true,
      });
    }).toThrow("Legacy transformProperties does not support options in v3");
  });

  it("should transform simple property", () => {
    const props = {};
    const data = { source: "value" };
    const result = legacyTransformProperties(props, data, "target");

    expect(result).toEqual({ target: { source: "value" } });
  });

  it("should transform with 'from' specified", () => {
    const props = {};
    const data = { source: { nested: "value" } };
    const result = legacyTransformProperties(props, data, "target", "source");

    expect(result).toEqual({ target: { nested: "value" } });
  });

  it("should transform with map object", () => {
    const props = {};
    const data = { name: "John", age: 30 };
    const result = legacyTransformProperties(props, data, {
      userName: "<% DATA.name %>",
      userAge: "<% DATA.age %>",
    });

    expect(result).toEqual({
      userName: "John",
      userAge: 30,
    });
  });

  it("should handle array data with mapArray=true", () => {
    const props = {};
    const data = [{ name: "John" }, { name: "Jane" }];
    const result = legacyTransformProperties(
      props,
      data,
      {
        users: "<% DATA.name %>",
      },
      undefined,
      true
    );

    expect(result).toEqual({
      users: ["John", "Jane"],
    });
  });

  it("should use v2Kit if available", () => {
    const mockV2Kit = {
      doTransform: jest.fn(),
      transformProperties: jest.fn().mockReturnValue({ transformed: true }),
    };
    (getV2RuntimeFromDll as jest.Mock).mockReturnValue(mockV2Kit);

    const props = {};
    const data = { test: "data" };
    const to = "target";
    const from = "source";
    const mapArray = true;
    const options = { option: true };

    const result = legacyTransformProperties(
      props,
      data,
      to,
      from,
      mapArray,
      options
    );

    expect(mockV2Kit.transformProperties).toHaveBeenCalledWith(
      props,
      data,
      to,
      from,
      mapArray,
      options
    );
    expect(result).toEqual({ transformed: true });
  });

  it("should handle array of transforms", () => {
    const props = {};
    const data = { first: "John", last: "Doe", age: 30 };
    const result = legacyTransformProperties(props, data, [
      { to: "firstName", from: "first" },
      { to: "lastName", from: "last" },
      { to: { fullAge: "<% DATA.age %>" }, from: undefined },
    ]);

    expect(result).toEqual({
      firstName: "John",
      lastName: "Doe",
      fullAge: 30,
    });
  });

  it("should handle to is null", () => {
    const props = {};
    const data = { name: "John" };
    const result = legacyTransformProperties(props, data, null);

    expect(result).toEqual({});
  });

  it("should handle map array with non-array", () => {
    const props = {};
    const data = { name: "John", age: 30 };
    const result = legacyTransformProperties(
      props,
      data,
      {
        users: "<% DATA.name %>",
      },
      undefined,
      true
    );

    expect(result).toEqual({
      users: ["John"],
    });
  });

  it("should handle not map array with array", () => {
    const props = {};
    const data = [{ name: "John" }, { name: "Jane" }];
    const result = legacyTransformProperties(
      props,
      data,
      {
        users: "<% DATA %>",
      },
      undefined,
      false
    );

    expect(result).toEqual({
      users: [{ name: "John" }, { name: "Jane" }],
    });
  });
});

describe("legacyTransformIntermediateData", () => {
  beforeEach(() => {
    (getV2RuntimeFromDll as jest.Mock).mockReturnValue(null);
    (runtimeModule._internalApiGetRuntimeContext as jest.Mock).mockReturnValue(
      {}
    );
  });

  it("should return data directly when 'to' is not provided", () => {
    const data = { source: "value" };
    const result = legacyTransformIntermediateData(data, null);
    expect(result).toEqual(data);
  });

  it("should extract data using 'from' path", () => {
    const data = { nested: { source: "value" } };
    const result = legacyTransformIntermediateData(data, null, "nested");
    expect(result).toEqual({ source: "value" });
  });

  it("should transform data according to 'to' parameter", () => {
    const data = { name: "John", age: 30 };
    const result = legacyTransformIntermediateData(data, {
      userName: "<% DATA.name %>",
      userAge: "<% DATA.age %>",
    });

    expect(result).toEqual({
      userName: "John",
      userAge: 30,
    });
  });

  it("should first extract data with 'from' then apply transformation", () => {
    const data = { user: { name: "John", age: 30 } };
    const result = legacyTransformIntermediateData(
      data,
      {
        userName: "<% DATA.name %>",
        userAge: "<% DATA.age %>",
      },
      "user"
    );

    expect(result).toEqual({
      userName: "John",
      userAge: 30,
    });
  });

  it("should handle array data with mapArray parameter", () => {
    const data = [{ name: "John" }, { name: "Jane" }];
    const result = legacyTransformIntermediateData(
      data,
      {
        displayName: "<% DATA.name %>",
      },
      undefined,
      true
    );

    expect(result).toEqual({
      displayName: ["John", "Jane"],
    });
  });
});
