import { GeneralTransform, PluginRuntimeContext } from "@next-core/brick-types";
import {
  transformProperties,
  transformIntermediateData,
  doTransform,
  transformElementProperties,
} from "./transformProperties";
import * as runtime from "./core/Runtime";
import { TrackingContextItem } from "./internal/listenOnTrackingContext";
import { symbolForTplContextId } from "./core/CustomTemplates/constants";
import { CustomTemplateContext } from "./core/CustomTemplates/CustomTemplateContext";
import { evaluate } from "./internal/evaluate";

jest.spyOn(runtime, "_internalApiGetCurrentContext").mockReturnValue({
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
} as PluginRuntimeContext);

const tplContext = new CustomTemplateContext({});
tplContext.setVariables({
  label: "quality",
  isShow: true,
});

interface Args {
  props: Parameters<typeof transformProperties>[0];
  data: Parameters<typeof transformProperties>[1];
  transform?: Parameters<typeof transformProperties>[2];
  transformFrom?: Parameters<typeof transformProperties>[3];
  transformMapArray?: Parameters<typeof transformProperties>[4];
  options?: Parameters<typeof transformProperties>[5];
}

describe("transformProperties", () => {
  it.each<[Args, ReturnType<typeof transformProperties>]>([
    // Assign whole data to a single property.
    [
      {
        props: {
          label: "hello",
        },
        data: "good",
        transform: "value",
      },
      {
        label: "hello",
        value: "good",
      },
    ],
    // Assign with `transformFrom`.
    [
      {
        props: {
          label: "hello",
        },
        data: {
          quality: "good",
        },
        transformFrom: "quality",
        transform: "value",
      },
      {
        label: "hello",
        value: "good",
      },
    ],
    // Assign mixed placeholders and literals.
    [
      {
        props: {},
        data: {
          name: "eve",
        },
        transform: {
          label: "hello",
          "outer.spread": {
            "inner.not.spread": true,
          },
          value: "@{}",
        },
      },
      {
        label: "hello",
        outer: {
          spread: {
            "inner.not.spread": true,
          },
        },
        value: {
          name: "eve",
        },
      },
    ],
    // Assign by array.
    [
      {
        props: {},
        data: [
          {
            name: "eve",
          },
          {
            name: "wall-e",
          },
        ],
        transform: {
          descriptions: {
            roles: ["admin"],
            value: "hi: @{name}",
            email: "@{email}",
          },
        },
      },
      {
        descriptions: [
          {
            roles: ["admin"],
            value: "hi: eve",
            email: undefined,
          },
          {
            roles: ["admin"],
            value: "hi: wall-e",
            email: undefined,
          },
        ],
      },
    ],
    // Assign string array.
    [
      {
        props: {},
        data: ["eve", "wall-e"],
        transform: {
          greetings: "hi: @{}",
        },
      },
      {
        greetings: ["hi: eve", "hi: wall-e"],
      },
    ],
    // Disable auto map array.
    [
      {
        props: {},
        data: ["eve", "wall-e"],
        transform: {
          greetings: "<% DATA.join(' and ') %>",
        },
        transformMapArray: false,
      },
      {
        greetings: "eve and wall-e",
      },
    ],
    // Assign from mixed array and non-array.
    [
      {
        props: {},
        data: {
          list: [
            {
              name: "eve",
            },
            {
              name: "wall-e",
            },
          ],
          total: 10,
        },
        transform: [
          {
            // Auto map array.
            from: "list",
            to: {
              greetings: "hi: @{name}",
            },
          },
          {
            // non-array.
            from: "total",
            to: "size",
          },
          {
            // Force to not map array.
            from: "list",
            to: {
              usersCount: "@{length}",
            },
            mapArray: false,
          },
          {
            // Force to map array from non-array.
            from: "total",
            to: "sizeList",
            mapArray: true,
          },
        ],
      },
      {
        greetings: ["hi: eve", "hi: wall-e"],
        size: 10,
        usersCount: 2,
        sizeList: [10],
      },
    ],
    // Access `EVENT`
    [
      {
        props: {},
        data: "good",
        transform: {
          label: "<% `${EVENT.detail} is ${DATA}` %>",
        },
      },
      {
        label: {
          [Symbol.for("pre.evaluated.raw")]:
            "<% `${EVENT.detail} is ${DATA}` %>",
          [Symbol.for("pre.evaluated.context")]: {
            data: "good",
          },
        },
      },
    ],
    // Assign mixed inject and transform.
    [
      {
        props: {
          label: "hello",
        },
        data: {
          quality: "good",
        },
        transform: {
          value: "${CTX.hello}:@{quality}",
        },
        options: {
          allowInject: true,
        },
      },
      {
        label: "hello",
        value: "Hello:good",
      },
    ],
    // No transform
    [
      {
        props: {
          label: "hello",
        },
        data: "good",
      },
      {
        label: "hello",
      },
    ],
  ])(
    "transformProperties(%j) should return %j",
    (
      { props, data, transform, transformFrom, transformMapArray, options },
      newProps
    ) => {
      expect(
        transformProperties(
          props,
          data,
          transform,
          transformFrom,
          transformMapArray,
          options
        )
      ).toEqual(newProps);
    }
  );
});

describe("transformIntermediateData", () => {
  const data: Parameters<typeof transformIntermediateData>[0] = {
    hello: "good",
    list: [1, 2],
  };

  it.each<
    [
      Parameters<typeof transformIntermediateData>[1],
      Parameters<typeof transformIntermediateData>[2],
      Parameters<typeof transformIntermediateData>[3],
      ReturnType<typeof transformIntermediateData>
    ]
  >([
    [
      undefined,
      undefined,
      undefined,
      {
        hello: "good",
        list: [1, 2],
      },
    ],
    [undefined, "hello", undefined, "good"],
    [
      "value",
      undefined,
      undefined,
      {
        value: {
          hello: "good",
          list: [1, 2],
        },
      },
    ],
    [
      "value",
      "hello",
      undefined,
      {
        value: "good",
      },
    ],
    [
      {
        item: "<% DATA.toFixed(2) %>",
      },
      "list", // Will perform auto map array.
      undefined,
      {
        item: ["1.00", "2.00"],
      },
    ],
    [
      {
        item: "<% DATA.join(' and ') %>",
      },
      "list",
      false, // Disable auto map array.
      {
        item: "1 and 2",
      },
    ],
  ])(
    'transformIntermediateData({hello:"good",list:[1,2]}, %j, %j) should return %j',
    (to, from, mapArray, result) => {
      expect(transformIntermediateData(data, to, from, mapArray)).toEqual(
        result
      );
    }
  );
});

describe("doTransform", () => {
  const data: Parameters<typeof doTransform>[0] = {
    hello: "good",
  };

  it.each<[Parameters<typeof doTransform>[1], ReturnType<typeof doTransform>]>([
    [
      {
        "button.click": {
          args: ["@{hello}"],
        },
      },
      {
        "button.click": {
          args: ["good"],
        },
      },
    ],
    [
      {
        value: "@{notExisted}",
      },
      {
        value: undefined,
      },
    ],
    [
      {
        value: "id=@{notExisted}",
      },
      {
        value: "id=",
      },
    ],
    ["<%~ `quality: ${DATA.hello}` %>", "quality: good"],
    [
      {
        [Symbol.for("pre.evaluated.raw")]:
          "<% `${TPL.label}: ${DATA.hello}` %>",
        [Symbol.for("pre.evaluated.context")]: {
          tplContextId: tplContext.id,
        },
      },
      "quality: good",
    ],
    [
      {
        brick: "any",
        [Symbol.for("test")]: "@{hello}",
      },
      {
        brick: "any",
        // Symbol property is kept and no computation was taken.
        [Symbol.for("test")]: "@{hello}",
      },
    ],
  ])('doTransform({hello:"good"}, %j, %j) should return %j', (to, result) => {
    expect(doTransform(data, to)).toEqual(result);
  });

  it("should work when set lazy", () => {
    const result = doTransform(
      "<% oops %>",
      {
        prop: "<% DATA %>",
      },
      {
        evaluateOptions: {
          lazy: true,
        },
      }
    );
    expect(result).toEqual({
      prop: {
        [Symbol.for("pre.evaluated.raw")]: "<% DATA %>",
        [Symbol.for("pre.evaluated.context")]: {
          data: "<% oops %>",
        },
      },
    });
  });

  it("should work for lazy useBrick", () => {
    const result = doTransform(
      {
        a: "yes",
        b: true,
      },
      {
        prop: "<% DATA.a %>",
        useBrick: {
          brick: "my-brick",
          if: "<% DATA.b %>",
          properties: {
            myProp: "<% DATA.c %>",
          },
          transform: {
            myTransform: "<% DATA.d %>",
          },
          events: {
            click: {
              action: "console.log",
              args: ["<% DATA.e %>", "<% DATA.f %>"],
            },
          },
          lifeCycle: {
            useResolves: [
              {
                useProvider: "my.provider",
                args: ["<% DATA.a %>"],
              },
            ],
          },
          [symbolForTplContextId]: "tpl-1",
        },
      },
      {
        $$lazyForUseBrick: true,
      }
    );
    expect(result).toEqual({
      prop: "yes",
      useBrick: {
        brick: "my-brick",
        if: "<% DATA.b %>",
        properties: {
          myProp: "<% DATA.c %>",
        },
        transform: {
          myTransform: "<% DATA.d %>",
        },
        events: {
          click: {
            action: "console.log",
            args: ["<% DATA.e %>", "<% DATA.f %>"],
          },
        },
        lifeCycle: {
          useResolves: [
            {
              useProvider: "my.provider",
              args: ["yes"],
            },
          ],
        },
        [symbolForTplContextId]: "tpl-1",
      },
    });

    const arrResult = doTransform(
      {
        a: "yes",
        b: true,
      },
      {
        prop: "<% DATA.a %>",
        useBrick: [
          {
            brick: "my-brick-1",
            if: "<% DATA.b %>",
            properties: {
              myProp: "<% DATA.c %>",
            },
            transform: {
              myTransform: "<% DATA.d %>",
            },
            events: {
              click: {
                action: "console.log",
                args: ["<% DATA.e %>", "<% DATA.f %>"],
              },
            },
            lifeCycle: {
              useResolves: [
                {
                  useProvider: "my.provider",
                  args: ["<% DATA.a %>"],
                },
              ],
            },
            [symbolForTplContextId]: "tpl-1",
          },
          {
            brick: "my-brick-2",
            if: "<% DATA.b %>",
            properties: {
              myProp: "<% DATA.c %>",
            },
            transform: {
              myTransform: "<% DATA.d %>",
            },
            events: {
              click: {
                action: "console.log",
                args: ["<% DATA.e %>", "<% DATA.f %>"],
              },
            },
            lifeCycle: {
              useResolves: [
                {
                  useProvider: "my.provider",
                  args: ["<% DATA.a %>"],
                },
              ],
            },
            [symbolForTplContextId]: "tpl-2",
          },
        ],
      },
      {
        $$lazyForUseBrick: true,
      }
    );
    expect(arrResult).toEqual({
      prop: "yes",
      useBrick: [
        {
          brick: "my-brick-1",
          if: "<% DATA.b %>",
          properties: {
            myProp: "<% DATA.c %>",
          },
          transform: {
            myTransform: "<% DATA.d %>",
          },
          events: {
            click: {
              action: "console.log",
              args: ["<% DATA.e %>", "<% DATA.f %>"],
            },
          },
          lifeCycle: {
            useResolves: [
              {
                useProvider: "my.provider",
                args: ["yes"],
              },
            ],
          },
          [symbolForTplContextId]: "tpl-1",
        },
        {
          brick: "my-brick-2",
          if: "<% DATA.b %>",
          properties: {
            myProp: "<% DATA.c %>",
          },
          transform: {
            myTransform: "<% DATA.d %>",
          },
          events: {
            click: {
              action: "console.log",
              args: ["<% DATA.e %>", "<% DATA.f %>"],
            },
          },
          lifeCycle: {
            useResolves: [
              {
                useProvider: "my.provider",
                args: ["yes"],
              },
            ],
          },
          [symbolForTplContextId]: "tpl-2",
        },
      ],
    });
  });

  it("should collect tracking context list", () => {
    const trackingContextList: TrackingContextItem[] = [];
    doTransform(
      {},
      {
        title: "<% 'track context', CTX.hello + CTX.world %>",
        message: "<% 'track state', STATE.hola %>",
        lazyProp: evaluate(
          "<% 'track state', STATE.lazyState %>",
          {
            hash: "#oops",
          },
          {
            lazy: true,
          }
        ),
        extra: "<% CTX.any %>",
        nesting: {
          // This should ignored since it is not at first level.
          any: "<% 'track context', CTX.oops %>",
        },
      },
      {
        trackingContextList,
      }
    );
    expect(trackingContextList).toEqual([
      {
        contextNames: ["hello", "world"],
        stateNames: false,
        propName: "title",
        propValue: "<% 'track context', CTX.hello + CTX.world %>",
      },
      {
        contextNames: false,
        stateNames: ["hola"],
        propName: "message",
        propValue: "<% 'track state', STATE.hola %>",
      },
      {
        contextNames: false,
        stateNames: ["lazyState"],
        propName: "lazyProp",
        propValue: {
          [Symbol.for("pre.evaluated.raw")]:
            "<% 'track state', STATE.lazyState %>",
          [Symbol.for("pre.evaluated.context")]: {
            hash: "#oops",
          },
        },
      },
    ]);
  });

  it("should allow inject", () => {
    const result = doTransform(
      {
        world: "World",
      },
      "${CTX.hello}=@{world}",
      {
        allowInject: true,
      }
    );
    expect(result).toBe("Hello=World");
  });

  it("should work while option had tplContextId", () => {
    const result = doTransform(
      {},
      {
        text: "<% TPL.isShow ? 'I am show' : 'I am hide' %>",
      },
      {
        tplContextId: tplContext.id,
      }
    );
    expect(result).toEqual({
      text: "I am show",
    });
  });
});

describe("transformElementProperties", () => {
  it.each<[any, GeneralTransform, Record<string, any>]>([
    [
      {
        quality: "good",
      },
      {
        qa: "<% DATA.quality %>",
      },
      {
        qa: "good",
      },
    ],
    [
      {
        quality: "good",
      },
      {
        style: {
          color: "<% DATA.quality === 'good' ? 'green' : 'red' %>",
        },
      },
      {
        style: {
          background: "blue",
          color: "green",
        },
      },
    ],
    [
      {
        quality: "good",
      },
      {
        "style.color": "<% DATA.quality === 'good' ? 'green' : 'red' %>",
      },
      {
        style: {
          color: "green",
        },
      },
    ],
    [
      {
        quality: "good",
      },
      {
        "existedProp.qa": "<% DATA.quality %>",
      },
      {
        existedProp: {
          hello: "world",
          qa: "good",
        },
      },
    ],
    [
      {
        quality: "good",
      },
      {
        existedProp: {
          qa: "<% DATA.quality %>",
        },
      },
      {
        existedProp: {
          qa: "good",
        },
      },
    ],
  ])(
    "transformElementProperties(div, %j, %j) should update div by %j",
    (data, to, result) => {
      const div = document.createElement("div") as any;
      div.style.background = "blue";
      div.existedProp = {
        hello: "world",
      };
      transformElementProperties(div, data, to);
      for (const [key, value] of Object.entries(result)) {
        if (key === "style") {
          for (const [styleName, styleValue] of Object.entries(value)) {
            expect(div.style[styleName]).toBe(styleValue);
          }
        } else if (typeof value === "object" && value) {
          expect(div[key]).toEqual(value);
        } else {
          expect(div[key]).toBe(value);
        }
      }
    }
  );
});
