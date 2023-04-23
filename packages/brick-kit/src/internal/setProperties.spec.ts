import { PluginRuntimeContext } from "@next-core/brick-types";
import {
  setProperties,
  computeRealValue,
  computeRealProperties,
} from "./setProperties";
import * as runtime from "../core/Runtime";
import { TrackingContextItem } from "./listenOnTrackingContext";
import { StateOfUseBrick } from "./getNextStateOfUseBrick";
import { CustomTemplateContext } from "../core/CustomTemplates/CustomTemplateContext";
import {
  symbolForComputedPropsFromProxy,
  symbolForRefForProxy,
  symbolForTplContextId,
} from "../core/CustomTemplates";

const mockCurrentContext = jest.spyOn(runtime, "_internalApiGetCurrentContext");
jest.spyOn(console, "error").mockImplementation(() => void 0);

const tplContext = new CustomTemplateContext({});
tplContext.setVariables({
  quality: "good",
});

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
      accessRule: "cmdb",
      isAdmin: true,
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
    ["${SYS.accessRule}", context, "cmdb"],
    ["${SYS.isAdmin}", context, true],
    ["${FLAGS.better-world}", context, true],
    ["<% !!FLAGS['better-world'] %>", { ...context, event: undefined }, true],
    [
      "<%~ !!FLAGS['perfect-world'] %>",
      { ...context, event: undefined },
      false,
    ],
    [
      {
        label: {
          [Symbol.for("pre.evaluated.raw")]:
            "<% `${EVENT.detail.to} is ${DATA}` %>",
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
    [
      {
        brick: "any",
        [Symbol.for("test")]: "${APP.homepage}",
      },
      context,
      {
        brick: "any",
        // Symbol property is kept and no computation was taken.
        [Symbol.for("test")]: "${APP.homepage}",
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

  it("should disallow recursive evaluations by default", () => {
    const dataWithEvaluation = ['<% !!FLAGS["better-world"] %>'];
    const result = computeRealValue(
      `<% ${JSON.stringify(dataWithEvaluation)} %>`,
      context,
      true
    ) as string[];
    expect(result).toEqual(dataWithEvaluation);
    expect(computeRealValue(result, context, true)).toEqual(dataWithEvaluation);
  });

  it("should allow recursive evaluations with recursive flag", () => {
    const dataWithEvaluation = ['<% !!FLAGS["better-world"] %>'];
    const result = computeRealValue(
      `<%~ ${JSON.stringify(dataWithEvaluation)} %>`,
      context,
      true
    ) as string[];
    expect(result).toEqual(dataWithEvaluation);
    expect(computeRealValue(result, context, true)).toEqual([true]);
  });

  it("should allow lazy inject", () => {
    const result = computeRealValue(
      {
        homepage: "${APP.homepage}",
        useBrick: {
          brick: "my-brick",
          properties: {
            q: "${QUERY.q}",
          },
        },
      },
      context,
      true,
      {
        $$lazyForUseBrick: true,
        $$stateOfUseBrick: StateOfUseBrick.INITIAL,
      }
    );
    expect(result).toEqual({
      homepage: "/host",
      useBrick: {
        brick: "my-brick",
        properties: {
          q: "${QUERY.q}",
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
      accessRule: "cmdb",
      isAdmin: true,
      isInIframe: false,
      isInIframeOfLegacyConsole: false,
    },
    flags: {
      "better-world": true,
    },
    tplContextId: tplContext.id,
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
    accessRule: "${SYS.accessRule}",
    isAdmin: "${SYS.isAdmin}",
    betterWorld: "${FLAGS.better-world}",
    array: "${QUERY_ARRAY.array}",
    arrayNotExisted: "${QUERY_ARRAY.arrayNotExisted}",
    fromTpl: "<% TPL.quality %>",
    dataset: {
      testid: "my-button",
    },
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
        accessRule: "cmdb",
        isAdmin: true,
        betterWorld: true,
        array: ["1", "2"],
        fromTpl: "good",
        dataset: {
          testid: "my-button",
        },
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
        accessRule: "cmdb",
        isAdmin: true,
        betterWorld: true,
        array: ["1", "2"],
        fromTpl: "good",
        dataset: {
          testid: "my-button",
        },
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
          accessRule: "cmdb",
          isAdmin: true,
          betterWorld: true,
          array: ["1", "2"],
          fromTpl: "good",
          dataset: {
            testid: "my-button",
          },
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
          accessRule: "cmdb",
          isAdmin: true,
          betterWorld: true,
          array: ["1", "2"],
          fromTpl: "good",
          dataset: {
            testid: "my-button",
          },
        },
      ],
    ],
    [
      {
        innerHTML: "<a>oops</a>",
      },
      context,
      false,
      false,
      {
        style: {},
        dataset: {},
        textContent: "<a>oops</a>",
      },
    ],
  ];
  it.each(cases)(
    "test setProperties(%s, %s, %s) should work",
    (props, ctx, injectDeep, multiple, expected) => {
      const createFakeElement = (): HTMLElement => {
        const element = {} as any;
        Object.defineProperty(element, "style", {
          value: {},
          writable: false,
          enumerable: true,
        });
        Object.defineProperty(element, "dataset", {
          value: {},
          writable: false,
          enumerable: true,
        });
        return element;
      };
      const elem: HTMLElement | HTMLElement[] = multiple
        ? [createFakeElement(), createFakeElement()]
        : createFakeElement();
      setProperties(elem, props, ctx, injectDeep);
      expect(elem).toEqual(expected);
    }
  );

  it("should ignore re-setup useBrick in template", () => {
    const element = {} as any;
    setProperties(
      element,
      {
        display: {
          useBrick: {
            brick: "my-brick",
          },
        },
      },
      context,
      true
    );
    expect(element).toEqual({
      display: {
        useBrick: {
          brick: "my-brick",
        },
      },
    });
  });
});

describe("computeRealProperties", () => {
  const context: PluginRuntimeContext = {
    app: {
      homepage: "/host",
      name: "host",
      id: "host",
    },
    storyboardContext: new Map([
      [
        "hello",
        {
          type: "free-variable",
          value: "Hello",
        },
      ],
      [
        "world",
        {
          type: "free-variable",
          value: "World",
        },
      ],
    ]),
  } as PluginRuntimeContext;

  beforeEach(() => {
    mockCurrentContext.mockReturnValue(context);
  });

  it("should work for lazy events in useBrick", () => {
    const { event, app, ...contextWithoutEvent } = context;
    const result = computeRealProperties(
      {
        shouldBeComputed: "<% APP.name %>",
        shouldBeLazy: {
          useBrick: [
            {
              brick: "a",
              if: "<% !!APP.homepage %>",
              properties: {
                shouldBeLazy: "<% APP.homepage %>",
              },
              transform: {
                shouldBeLazy: "<% APP.homepage %>",
              },
              events: {
                click: {
                  action: "console.log",
                  args: ["<% APP.name %>", "<% CTX.memo %>"],
                },
              },
              lifeCycle: {
                useResolves: [
                  {
                    useProvider: "my.provider",
                    args: ["<% APP.name %>"],
                    transform: {
                      shouldBeLazy: "<% APP.homepage %>",
                    },
                    onReject: {
                      transform: {
                        shouldBeLazy: "<% APP.homepage %>",
                      },
                      isolatedCrash: "<% true %>",
                    },
                  },
                ],
                onPageLoad: "<% null %>",
              },
            },
          ],
        },
      },
      contextWithoutEvent,
      true
    );
    expect(result).toEqual({
      shouldBeComputed: "host",
      shouldBeLazy: {
        useBrick: [
          {
            brick: "a",
            if: "<% !!APP.homepage %>",
            properties: {
              shouldBeLazy: "<% APP.homepage %>",
            },
            transform: {
              shouldBeLazy: "<% APP.homepage %>",
            },
            events: {
              click: {
                action: "console.log",
                args: ["<% APP.name %>", "<% CTX.memo %>"],
              },
            },
            lifeCycle: {
              useResolves: [
                {
                  useProvider: "my.provider",
                  args: ["host"],
                  transform: {
                    shouldBeLazy: "<% APP.homepage %>",
                  },
                  onReject: {
                    transform: {
                      shouldBeLazy: "<% APP.homepage %>",
                    },
                    isolatedCrash: true,
                  },
                },
              ],
              onPageLoad: null,
            },
          },
        ],
      },
    });
  });

  it("should work for lazy events in useBrick slots", () => {
    const { event, app, ...contextWithoutEvent } = context;
    const result = computeRealProperties(
      {
        shouldBeComputed: "<% APP.name %>",
        useBrick: {
          brick: "a",
          slots: {
            "": {
              type: "bricks",
              bricks: [
                {
                  brick: "b",
                  if: "<% !!APP.homepage %>",
                  properties: {
                    shouldBeLazy: "<% APP.homepage %>",
                  },
                  transform: {
                    shouldBeLazy: "<% APP.homepage %>",
                  },
                  events: {
                    click: {
                      action: "console.log",
                      args: ["<% APP.name %>", "<% CTX.memo %>"],
                    },
                  },
                  lifeCycle: {
                    useResolves: [
                      {
                        useProvider: "my.provider",
                        args: ["<% APP.name %>"],
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
      contextWithoutEvent,
      true
    );
    expect(result).toEqual({
      shouldBeComputed: "host",
      useBrick: {
        brick: "a",
        slots: {
          "": {
            type: "bricks",
            bricks: [
              {
                brick: "b",
                if: "<% !!APP.homepage %>",
                properties: {
                  shouldBeLazy: "<% APP.homepage %>",
                },
                transform: {
                  shouldBeLazy: "<% APP.homepage %>",
                },
                events: {
                  click: {
                    action: "console.log",
                    args: ["<% APP.name %>", "<% CTX.memo %>"],
                  },
                },
                lifeCycle: {
                  useResolves: [
                    {
                      useProvider: "my.provider",
                      args: ["host"],
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    });
  });

  it("should collect tracking context list", () => {
    const trackingContextList: TrackingContextItem[] = [];
    computeRealProperties(
      {
        title: "<% 'track context', CTX.hello + CTX.world %>",
        message: "<% 'track state', STATE.hola %>",
        extra: "<% CTX.any %>",
      },
      context,
      true,
      trackingContextList
    );
    expect(trackingContextList).toEqual([
      {
        contextNames: ["hello", "world"],
        stateNames: false,
        formStateNames: false,
        propName: "title",
        propValue: "<% 'track context', CTX.hello + CTX.world %>",
      },
      {
        contextNames: false,
        stateNames: ["hola"],
        formStateNames: false,
        propName: "message",
        propValue: "<% 'track state', STATE.hola %>",
      },
    ]);
  });
});
