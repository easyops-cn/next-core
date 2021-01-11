import { GeneralTransform } from "@easyops/brick-types";
import {
  transformProperties,
  transformIntermediateData,
  doTransform,
  transformElementProperties,
} from "./transformProperties";
import * as runtime from "./core/Runtime";

jest.spyOn(runtime, "_internalApiGetCurrentContext").mockReturnValue({} as any);

interface Args {
  props: Parameters<typeof transformProperties>[0];
  data: Parameters<typeof transformProperties>[1];
  transform?: Parameters<typeof transformProperties>[2];
  transformFrom?: Parameters<typeof transformProperties>[3];
  transformMapArray?: Parameters<typeof transformProperties>[4];
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
          [Symbol.for(
            "pre.evaluated.raw"
          )]: "<% `${EVENT.detail} is ${DATA}` %>",
          [Symbol.for("pre.evaluated.context")]: {
            data: "good",
          },
        },
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
      { props, data, transform, transformFrom, transformMapArray },
      newProps
    ) => {
      expect(
        transformProperties(
          props,
          data,
          transform,
          transformFrom,
          transformMapArray
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
        [Symbol.for(
          "pre.evaluated.raw"
        )]: "<% `${TPL.label}: ${DATA.hello}` %>",
        [Symbol.for("pre.evaluated.context")]: {
          getTplVariables: () => ({
            label: "quality",
          }),
        },
      },
      "quality: good",
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
