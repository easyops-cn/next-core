import { PluginRuntimeContext } from "@easyops/brick-types";
import { setProperties, computeRealValue } from "./setProperties";
import * as runtime from "./core/Runtime";

const mockCurrentContext = jest.spyOn(runtime, "_internalApiGetCurrentContext");
jest.spyOn(console, "error").mockImplementation(() => void 0);

describe("computeRealValue", () => {
  const context: PluginRuntimeContext = {
    event: new CustomEvent("hello", {
      detail: {
        to: "world",
      },
    }),
    app: {
      homepage: "/host",
      name: "host",
      id: "host",
    },
    sys: {
      username: "easyops",
      userInstanceId: "acbd46b",
    },
    flags: {
      "better-world": true,
    },
  } as any;

  beforeEach(() => {
    mockCurrentContext.mockReturnValue(context);
  });

  const cases: [any, PluginRuntimeContext, any][] = [
    ["oops", context, "oops"],
    ["${EVENT.type}", context, "hello"],
    [
      "${EVENT.detail}",
      context,
      {
        to: "world",
      },
    ],
    [["${EVENT.detail.to}"], context, ["world"]],
    [{ "${EVENT.detail.to}": "1" }, context, { world: "1" }],
    [
      "${EVENT.detail}",
      {
        app: context.app,
        query: null,
      },
      "${EVENT.detail}",
    ],
    ["${EVENT.detail|jsonStringify}", context, '{\n  "to": "world"\n}'],
    [
      "${HASH.*|string}",
      {
        hash: "#123",
        query: null,
      },
      "#123",
    ],
    ["${APP.homepage}", context, "/host"],
    ["${SYS.username}", context, "easyops"],
    ["${SYS.userInstanceId}", context, "acbd46b"],
    ["${FLAGS.better-world}", context, true],
    ["<% FLAGS['better-world'] %>", { ...context, event: undefined }, true],
    [
      {
        label: {
          [Symbol.for(
            "pre.evaluated.raw"
          )]: "<% `${EVENT.detail.to} is ${DATA}` %>",
          [Symbol.for("pre.evaluated.context")]: {
            data: "good",
          },
        },
      },
      context,
      {
        label: "world is good",
      },
    ],
  ];
  it.each(cases)(
    "test computeRealValue(%s, %s, true) should work",
    (args, ctx, expected) => {
      const result = computeRealValue(args, ctx, true);
      expect(result).toEqual(expected);
    }
  );

  it("should work for lazy events in useBrick", () => {
    const { event, ...contextWithoutEvent } = context;
    const result = computeRealValue(
      {
        properties: {
          shouldBeComputed: "<% APP.name %>",
        },
        useBrick: {
          brick: "a",
          properties: {
            shouldBeComputed: "<% APP.homepage %>",
          },
          events: {
            click: {
              action: "console.log",
              args: ["<% APP.name %>", "<% CTX.memo %>"],
            },
          },
        },
      },
      contextWithoutEvent,
      true,
      {
        $$lazyForUseBrickEvents: true,
      }
    );
    expect(result).toEqual({
      properties: {
        shouldBeComputed: "host",
      },
      useBrick: {
        brick: "a",
        properties: {
          shouldBeComputed: "/host",
        },
        events: {
          click: {
            action: "console.log",
            args: ["<% APP.name %>", "<% CTX.memo %>"],
          },
        },
      },
    });
  });
});

describe("setProperties", () => {
  const originalQuery =
    "q=abc&page=2&sort=name&asc=1&extra=0&fields=%7B%7D&errors=&name=abc&key=K&array=1&array=2";
  const context: PluginRuntimeContext = {
    query: new URLSearchParams(originalQuery),
    match: {
      params: {
        objectId: "HOST",
      },
      path: "",
      url: "",
      isExact: false,
    },
    event: new CustomEvent("hello", {
      detail: "world",
    }),
    app: {
      homepage: "/cmdb",
      name: "cmdb",
      id: "cmdb",
    },
    sys: {
      org: 8888,
      username: "easyops",
      userInstanceId: "acbd46b",
      isInIframe: false,
      isInIframeOfLegacyConsole: false,
    },
    flags: {
      "better-world": true,
    },
    getTplVariables: () => ({
      quality: "good",
    }),
  };
  const properties = {
    objectId: "${objectId}",
    instanceId: "${instanceId}",
    q: "${QUERY.q}",
    page: "${QUERY.page|number}",
    pageSize: "${QUERY.pageSize=20|number}",
    sort: "${QUERY.sort}",
    asc: "${QUERY.asc|boolean}",
    extra: "${QUERY.extra|bool}",
    fields: "${QUERY.fields|json}",
    errors: "${QUERY.errors|json}",
    style: {
      width: "10px",
      height: "${QUERY.pageSize=20|number}px",
    },
    items: [] as any[],
    query: {
      name: { $eq: "${QUERY.name}" },
    },
    selectedKeys: ["${QUERY.key}"],
    url: "/objects/${objectId=}/instances/${instanceId}",
    allQueryAsString: "${QUERY.*|string}",
    urlToDetail: "${APP.homepage}/${objectId}",
    username: "${SYS.username}",
    userInstanceId: "${SYS.userInstanceId}",
    betterWorld: "${FLAGS.better-world}",
    array: "${QUERY_ARRAY.array}",
    arrayNotExisted: "${QUERY_ARRAY.arrayNotExisted}",
    fromTpl: "<% TPL.quality %>",
  };

  beforeEach(() => {
    mockCurrentContext.mockReturnValue(context);
  });

  const cases: [
    Record<string, any>,
    PluginRuntimeContext,
    boolean,
    boolean,
    Record<string, any>
  ][] = [
    [
      properties,
      context,
      false,
      false,
      {
        objectId: "HOST",
        q: "abc",
        page: 2,
        pageSize: 20,
        sort: "name",
        asc: true,
        extra: false,
        fields: {},
        style: {
          width: "10px",
          height: "${QUERY.pageSize=20|number}px",
        },
        items: [],
        query: {
          name: { $eq: "${QUERY.name}" },
        },
        selectedKeys: ["${QUERY.key}"],
        url: "/objects/HOST/instances/",
        allQueryAsString: originalQuery,
        urlToDetail: "/cmdb/HOST",
        username: "easyops",
        userInstanceId: "acbd46b",
        betterWorld: true,
        array: ["1", "2"],
        fromTpl: "good",
      },
    ],
    [
      properties,
      context,
      true,
      false,
      {
        objectId: "HOST",
        q: "abc",
        page: 2,
        pageSize: 20,
        sort: "name",
        asc: true,
        extra: false,
        fields: {},
        style: {
          width: "10px",
          height: "20px",
        },
        items: [],
        query: {
          name: { $eq: "abc" },
        },
        selectedKeys: ["K"],
        url: "/objects/HOST/instances/",
        allQueryAsString: originalQuery,
        urlToDetail: "/cmdb/HOST",
        username: "easyops",
        userInstanceId: "acbd46b",
        betterWorld: true,
        array: ["1", "2"],
        fromTpl: "good",
      },
    ],
    [
      properties,
      context,
      false,
      true,
      [
        {
          objectId: "HOST",
          q: "abc",
          page: 2,
          pageSize: 20,
          sort: "name",
          asc: true,
          extra: false,
          fields: {},
          style: {
            width: "10px",
            height: "${QUERY.pageSize=20|number}px",
          },
          items: [],
          query: {
            name: { $eq: "${QUERY.name}" },
          },
          selectedKeys: ["${QUERY.key}"],
          url: "/objects/HOST/instances/",
          allQueryAsString: originalQuery,
          urlToDetail: "/cmdb/HOST",
          username: "easyops",
          userInstanceId: "acbd46b",
          betterWorld: true,
          array: ["1", "2"],
          fromTpl: "good",
        },
        {
          objectId: "HOST",
          q: "abc",
          page: 2,
          pageSize: 20,
          sort: "name",
          asc: true,
          extra: false,
          fields: {},
          style: {
            width: "10px",
            height: "${QUERY.pageSize=20|number}px",
          },
          items: [],
          query: {
            name: { $eq: "${QUERY.name}" },
          },
          selectedKeys: ["${QUERY.key}"],
          url: "/objects/HOST/instances/",
          allQueryAsString: originalQuery,
          urlToDetail: "/cmdb/HOST",
          username: "easyops",
          userInstanceId: "acbd46b",
          betterWorld: true,
          array: ["1", "2"],
          fromTpl: "good",
        },
      ],
    ],
    [
      {
        innerHTML: "oops",
      },
      context,
      false,
      false,
      {
        style: {},
        textContent: "oops",
      },
    ],
  ];
  it.each(cases)(
    "test setProperties(%s, %s, %s) should work",
    (props, ctx, injectDeep, multiple, expected) => {
      const elem: HTMLElement | HTMLElement[] = multiple
        ? ([
            {
              style: {},
            },
            {
              style: {},
            },
          ] as any[])
        : ({
            style: {},
          } as any);
      setProperties(elem, props, ctx, injectDeep);
      expect(elem).toEqual(expected);
    }
  );
});
