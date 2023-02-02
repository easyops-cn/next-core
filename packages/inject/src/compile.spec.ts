import { RuntimeContext } from "@next-core/brick-types";
import { transform, inject, transformAndInject } from "./compile.js";

const originalQuery =
  "q=abc&page=2&sort=name&asc=1&extra=0&fields=%7B%7D&errors=&name=abc&key=K&array=1&array=2";

const context: RuntimeContext = {
  query: new URLSearchParams(originalQuery),
  // hash: "#yes",
  // match: {
  //   params: {
  //     objectId: "HOST",
  //   },
  //   path: "",
  //   url: "",
  //   isExact: false,
  // },
  event: {
    type: "hello",
    detail: "world",
  } as any,
  app: {
    homepage: "/cmdb",
    name: "cmdb",
    id: "cmdb",
  },
  // sys: {
  //   org: 8888,
  //   username: "easyops",
  //   userInstanceId: "acbd46b",
  // } as any,
  // flags: {
  //   "better-world": true,
  // },
} as any;

describe("transform", () => {
  it.each<[string, any, any]>([
    [
      "@{}",
      {
        quality: "good",
      },
      {
        quality: "good",
      },
    ],
    [
      "good",
      {
        quality: "good",
      },
      "good",
    ],
    [
      "q=@{quality}&p=@{page}&size=@{size=10}&asc=@{asc|bool | number}",
      {
        quality: "good",
      },
      "q=good&p=&size=10&asc=0",
    ],
  ])("transform(%j, %j) should return %j", (raw, data, result) => {
    expect(transform(raw, data)).toEqual(result);
  });

  it("should throw if a placeholder is invalid", () => {
    expect(() => {
      transform("q=@{", {});
    }).toThrowErrorMatchingInlineSnapshot(
      `"Expected a placeholder end '}' at the end"`
    );
    expect(() => {
      transform("q=@{quality=[}", {});
    }).toThrowErrorMatchingInlineSnapshot(
      `"Failed to match a JSON value at index 12 near: \\"[}\\""`
    );
    expect(() => {
      transform("q=@{quality|map:[}", {});
    }).toThrowErrorMatchingInlineSnapshot(
      `"Failed to match a JSON value at index 16 near: \\"[}\\""`
    );
  });
});

describe("inject", () => {
  it.each<[string, RuntimeContext, any]>([
    ["raw", context, "raw"],
    [
      "${}", // Invalid placeholder.
      context,
      "${}",
    ],
    ["${objectId}", {} as any, "${objectId}"],
    ["${objectId}", context, "HOST"],
    ["${instanceId}", context, undefined],
    ["${QUERY.q}", context, "abc"],
    ["${QUERY.page|number}", context, 2],
    ["${QUERY.pageSize=20|number}", context, 20],
    [
      "/objects/${objectId=}/instances/${instanceId}",
      context,
      "/objects/HOST/instances/",
    ],
    ["${QUERY.*|string}", context, originalQuery],
    ["${APP.homepage}/${objectId}", context, "/cmdb/HOST"],
    [
      "${APP.homepage}/${objectId}",
      {
        ...context,
        overrideApp: {
          homepage: "/override",
        },
      },
      "/override/HOST",
    ],
    ["${SYS.username}", context, "easyops"],
    ["${FLAGS.better-world}", context, true],
    ["${QUERY_ARRAY.array}", context, ["1", "2"]],
    ["${QUERY_ARRAY.arrayNotExisted}", context, undefined],
    ["${HASH}", context, "#yes"],
    ["${HASH.*}", context, "#yes"],
    ["${EVENT.detail}", context, "world"],
    [
      "${EVENT.*}",
      context,
      {
        type: "hello",
        detail: "world",
      },
    ],
    [
      "${EVENT.detail}",
      {
        ...context,
        event: undefined,
      },
      "${EVENT.detail}",
    ],
    ["${ANCHOR}", context, "yes"],
    ["${CTX.myFreeContext}", context, "good"],
    ["${CTX.myPropContext}", context, "better"],
    ["${CTX.notExisted}", context, undefined],
  ])("inject(%j, %o) should return %j", (raw, data, result) => {
    expect(inject(raw, data)).toEqual(result);
  });

  it("should throw if a placeholder is invalid", () => {
    expect(() => {
      inject("q=${", context);
    }).toThrowErrorMatchingInlineSnapshot(
      `"Expected a placeholder end '}' at the end"`
    );
    expect(() => {
      inject("q=${quality=[}", context);
    }).toThrowErrorMatchingInlineSnapshot(
      `"Failed to match a JSON value at index 12 near: \\"[}\\""`
    );
    expect(() => {
      inject("q=${quality|map:[}", context);
    }).toThrowErrorMatchingInlineSnapshot(
      `"Failed to match a JSON value at index 16 near: \\"[}\\""`
    );
  });
});

describe("transformAndInject", () => {
  it.each<[string, any, any, any]>([
    [
      "@{}",
      {
        quality: "good",
      },
      context,
      {
        quality: "good",
      },
    ],
    [
      "good",
      {
        quality: "good",
      },
      context,
      "good",
    ],
    [
      "q=${QUERY.q}&p=@{page}&size=@{size=10}&asc=@{asc|bool | number}&lazy=${EVENT.detail}",
      {
        quality: "good",
      },
      {
        ...context,
        event: undefined,
      },
      "q=abc&p=&size=10&asc=0&lazy=${EVENT.detail}",
    ],
  ])(
    "transformAndInject(%j, %j) should return %j",
    (raw, data, context, result) => {
      expect(transformAndInject(raw, data, context)).toEqual(result);
    }
  );

  it("should throw if a placeholder is invalid", () => {
    expect(() => {
      transformAndInject("q=@{", {}, context);
    }).toThrowErrorMatchingInlineSnapshot(
      `"Expected a placeholder end '}' at the end"`
    );
    expect(() => {
      transformAndInject("q=@{quality=[}", {}, context);
    }).toThrowErrorMatchingInlineSnapshot(
      `"Failed to match a JSON value at index 12 near: \\"[}\\""`
    );
    expect(() => {
      transformAndInject("q=${quality|map:[}", {}, context);
    }).toThrowErrorMatchingInlineSnapshot(
      `"Failed to match a JSON value at index 16 near: \\"[}\\""`
    );
  });
});
