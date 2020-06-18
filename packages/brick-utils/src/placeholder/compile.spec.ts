import { PluginRuntimeContext } from "@easyops/brick-types";
import { transform, inject } from "./compile";

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
    });
    expect(() => {
      transform("q=@{quality=[}", {});
    });
    expect(() => {
      transform("q=@{quality|map:[}", {});
    });
  });
});

describe("inject", () => {
  const originalQuery =
    "q=abc&page=2&sort=name&asc=1&extra=0&fields=%7B%7D&errors=&name=abc&key=K&array=1&array=2";
  const context: PluginRuntimeContext = {
    query: new URLSearchParams(originalQuery),
    hash: "#yes",
    match: {
      params: {
        objectId: "HOST",
      },
      path: "",
      url: "",
      isExact: false,
    },
    event: {
      type: "hello",
      detail: "world",
    } as any,
    app: {
      homepage: "/cmdb",
      name: "cmdb",
      id: "cmdb",
    },
    sys: {
      org: 8888,
      username: "easyops",
      userInstanceId: "acbd46b",
    },
    flags: {
      "better-world": true,
    },
    storyboardContext: new Map<string, any>([
      [
        "myFreeContext",
        {
          type: "free-variable",
          value: "good",
        },
      ],
      [
        "myPropContext",
        {
          type: "brick-property",
          brick: {
            element: {
              quality: "better",
            },
          },
          prop: "quality",
        },
      ],
    ]),
  };

  it.each<[string, PluginRuntimeContext, any]>([
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
      transform("q=${", context);
    });
    expect(() => {
      inject("q=${quality=[}", context);
    });
    expect(() => {
      inject("q=${quality|map:[}", context);
    });
  });
});
