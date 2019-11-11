import { setProperties, computeRealValue } from "./setProperties";
import { PluginRuntimeContext } from "@easyops/brick-types";

describe("computeRealValue", () => {
  const context: PluginRuntimeContext = {
    event: new CustomEvent("hello", {
      detail: {
        to: "world"
      }
    }),
    app: {
      homepage: "/host",
      name: "host",
      id: "host"
    }
  } as any;
  const cases: [any[], PluginRuntimeContext, any[]][] = [
    [["oops"], context, ["oops"]],
    [["${EVENT.type}"], context, ["hello"]],
    [
      ["${EVENT.detail}"],
      context,
      [
        {
          to: "world"
        }
      ]
    ],
    [["${EVENT.detail.to}"], context, ["world"]],
    [[{ "${EVENT.detail.to}": "1" }], context, [{ world: "1" }]],
    [
      ["${EVENT.detail}"],
      {
        app: context.app,
        query: null
      },
      ["${EVENT.detail}"]
    ],
    [
      ["${HASH.*|string}"],
      {
        hash: "#123",
        query: null
      },
      ["#123"]
    ],
    [["${APP.homepage}"], context, ["/host"]]
  ];
  it.each(cases)(
    "test computeRealValue(%s, %s, true) should work",
    (args, ctx, expected) => {
      const result = computeRealValue(args, ctx, true);
      expect(result).toEqual(expected);
    }
  );
});

describe("setProperties", () => {
  const originalQuery =
    "q=abc&page=2&sort=name&asc=1&extra=0&fields=%7B%7D&errors=&name=abc&key=K";
  const context: PluginRuntimeContext = {
    query: new URLSearchParams(originalQuery),
    match: {
      params: {
        objectId: "HOST"
      },
      path: "",
      url: "",
      isExact: false
    },
    event: new CustomEvent("hello", {
      detail: "world"
    }),
    app: {
      homepage: "/cmdb",
      name: "cmdb",
      id: "cmdb"
    }
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
      width: "10px"
    },
    items: [] as any[],
    query: {
      name: { $eq: "${QUERY.name}" }
    },
    selectedKeys: ["${QUERY.key}"],
    url: "/objects/${objectId}/instances/${instanceId}",
    allQueryAsString: "${QUERY.*|string}",
    urlToDetail: "${APP.homepage}/${objectId}"
  };
  const cases: [
    Record<string, any>,
    PluginRuntimeContext,
    boolean,
    Record<string, any>
  ][] = [
    [
      properties,
      context,
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
          width: "10px"
        },
        items: [],
        query: {
          name: { $eq: "${QUERY.name}" }
        },
        selectedKeys: ["${QUERY.key}"],
        url: "/objects/HOST/instances/undefined",
        allQueryAsString: originalQuery,
        urlToDetail: "/cmdb/HOST"
      }
    ],
    [
      properties,
      context,
      true,
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
          width: "10px"
        },
        items: [],
        query: {
          name: { $eq: "abc" }
        },
        selectedKeys: ["K"],
        url: "/objects/HOST/instances/undefined",
        allQueryAsString: originalQuery,
        urlToDetail: "/cmdb/HOST"
      }
    ]
  ];
  it.each(cases)(
    "test serProperties(%s, %s, %s) should work",
    (props, ctx, injectDeep, expected) => {
      const elem: HTMLElement = {
        style: {}
      } as any;
      setProperties(elem, props, ctx, injectDeep);
      expect(elem).toEqual(expected);
    }
  );
});
