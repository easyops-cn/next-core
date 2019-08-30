import { setProperties, computeRealValue } from "./setProperties";
import { PluginRuntimeContext } from "@easyops/brick-types";

describe("computeRealValue", () => {
  const context: PluginRuntimeContext = {
    event: new CustomEvent("hello", {
      detail: {
        to: "world"
      }
    })
  } as any;
  const cases: [any[], PluginRuntimeContext, any[]][] = [
    [["oops"], context, ["oops"]],
    [["${event.type}"], context, ["hello"]],
    [
      ["${event.detail}"],
      context,
      [
        {
          to: "world"
        }
      ]
    ],
    [["${event.detail.to}"], context, ["world"]],
    [[{ "${event.detail.to}": "1" }], context, [{ world: "1" }]]
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
    })
  };
  const properties = {
    objectId: "${objectId}",
    instanceId: "${instanceId}",
    q: "${query.q}",
    page: "${query.page|number}",
    pageSize: "${query.pageSize=20|number}",
    sort: "${query.sort}",
    asc: "${query.asc|boolean}",
    extra: "${query.extra|bool}",
    fields: "${query.fields|json}",
    errors: "${query.errors|json}",
    style: {
      width: "10px"
    },
    items: [],
    query: {
      name: { $eq: "${query.name}" }
    },
    selectedKeys: ["${query.key}"],
    url: "/objects/${objectId}/instances/${instanceId}",
    allQueryAsString: "${query.*|string}"
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
          name: { $eq: "${query.name}" }
        },
        selectedKeys: ["${query.key}"],
        url: "/objects/HOST/instances/undefined",
        allQueryAsString: originalQuery
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
        allQueryAsString: originalQuery
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
