import { CustomApi, CustomApiParams, processExtFields } from "./CustomApi";

jest.mock("@next-core/brick-http", () => ({
  http: {
    simpleRequest: jest
      .fn()
      .mockResolvedValue({ data: "simpleRequest resolved" }),
    requestWithBody: jest
      .fn()
      .mockResolvedValue({ data: "requestWithBody resolved" }),
  },
}));

describe("CustomApi", () => {
  it.each<[CustomApiParams, any, any, any]>([
    [
      {
        url: "/xxx",
        method: "get",
        responseWrapper: true,
      },
      { a: 1 } as any,
      undefined,
      "simpleRequest resolved",
    ],
    [
      {
        url: "/xxx",
      },
      { a: 1 } as any,
      undefined,
      "simpleRequest resolved",
    ],
    [
      {
        url: "/xxx",
        responseWrapper: false,
      },
      { a: 1 } as any,
      undefined,
      { data: "simpleRequest resolved" },
    ],
    [
      {
        url: "/xxx",
        method: "post",
        responseWrapper: false,
      },
      { a: 1 } as any,
      undefined,
      { data: "requestWithBody resolved" },
    ],
    [
      {
        url: "/xxx",
        method: "post",
        responseWrapper: true,
      },
      { a: 1 } as any,
      { headers: new Headers({ "x-requested-with": "XMLHttpRequest" }) } as any,
      "requestWithBody resolved",
    ],
  ])("CustomApi(%j) should work", async (params1, params2, params3, result) => {
    expect(await CustomApi(params1, params2, params3)).toEqual(result);
  });

  it.each([
    [
      [
        {
          name: "page",
          source: "query",
        },
      ],
      {
        page: 1,
      },
      undefined,
      {
        data: {},
        options: {
          params: {
            page: 1,
          },
        },
      },
    ],
    [
      [
        {
          name: "page",
          source: "query",
        },
        {
          name: "instance",
          source: "body",
        },
      ],
      {
        instance: {
          name: "test",
          instanceId: "bacd2",
        },
      },
      {
        page: 1,
      },
      {
        data: { instance: { instanceId: "bacd2", name: "test" } },
        options: { params: { page: 1 } },
      },
    ],
    [
      [
        {
          name: "instance",
          type: "object",
        },
      ],
      {
        instance: {
          name: "test",
          instanceId: "bacd2",
        },
      },
      {
        interceptorParams: { ignoreLoadingBar: true },
      },
      {
        data: { instance: { instanceId: "bacd2", name: "test" } },
        options: { interceptorParams: { ignoreLoadingBar: true } },
      },
    ],
  ])(
    "processExtFields(%j) should work",
    (params1, params2, params3, result) => {
      expect(processExtFields(params1, params2, params3)).toEqual(result);
    }
  );
});
