import {
  transformProperties,
  transformIntermediateData,
  doTransform
} from "./transformProperties";

interface Args {
  props: Parameters<typeof transformProperties>[0];
  data: Parameters<typeof transformProperties>[1];
  transform?: Parameters<typeof transformProperties>[2];
  transformFrom?: Parameters<typeof transformProperties>[3];
}

describe("transformProperties", () => {
  it.each<[Args, ReturnType<typeof transformProperties>]>([
    // Assign whole data to a single property.
    [
      {
        props: {
          label: "hello"
        },
        data: "good",
        transform: "value"
      },
      {
        label: "hello",
        value: "good"
      }
    ],
    // Assign with `transformFrom`.
    [
      {
        props: {
          label: "hello"
        },
        data: {
          quality: "good"
        },
        transformFrom: "quality",
        transform: "value"
      },
      {
        label: "hello",
        value: "good"
      }
    ],
    // Assign mixed placeholders and literals.
    [
      {
        props: {},
        data: {
          name: "eve"
        },
        transform: {
          label: "hello",
          "outer.spread": {
            "inner.not.spread": true
          },
          value: "@{}"
        }
      },
      {
        label: "hello",
        outer: {
          spread: {
            "inner.not.spread": true
          }
        },
        value: {
          name: "eve"
        }
      }
    ],
    // Assign by array.
    [
      {
        props: {},
        data: [
          {
            name: "eve"
          },
          {
            name: "wall-e"
          }
        ],
        transform: {
          descriptions: {
            roles: ["admin"],
            value: "hi: @{name}",
            email: "@{email}"
          }
        }
      },
      {
        descriptions: [
          {
            roles: ["admin"],
            value: "hi: eve",
            email: undefined
          },
          {
            roles: ["admin"],
            value: "hi: wall-e",
            email: undefined
          }
        ]
      }
    ],
    // Assign string array.
    [
      {
        props: {},
        data: ["eve", "wall-e"],
        transform: {
          greetings: "hi: @{}"
        }
      },
      {
        greetings: ["hi: eve", "hi: wall-e"]
      }
    ],
    // Assign from mixed array and non-array.
    [
      {
        props: {},
        data: {
          list: [
            {
              name: "eve"
            },
            {
              name: "wall-e"
            }
          ],
          total: 10
        },
        transform: [
          {
            // Auto map array.
            from: "list",
            to: {
              greetings: "hi: @{name}"
            }
          },
          {
            // non-array.
            from: "total",
            to: "size"
          },
          {
            // Force to not map array.
            from: "list",
            to: {
              usersCount: "@{length}"
            },
            mapArray: false
          },
          {
            // Force to map array from non-array.
            from: "total",
            to: "sizeList",
            mapArray: true
          }
        ]
      },
      {
        greetings: ["hi: eve", "hi: wall-e"],
        size: 10,
        usersCount: 2,
        sizeList: [10]
      }
    ],
    // No transform
    [
      {
        props: {
          label: "hello"
        },
        data: "good"
      },
      {
        label: "hello"
      }
    ]
  ])(
    "transformProperties(%j) should return %j",
    ({ props, data, transform, transformFrom }, newProps) => {
      expect(
        transformProperties(props, data, transform, transformFrom)
      ).toEqual(newProps);
    }
  );
});

describe("transformIntermediateData", () => {
  const data: Parameters<typeof transformIntermediateData>[0] = {
    hello: "good"
  };

  it.each<
    [
      Parameters<typeof transformIntermediateData>[1],
      Parameters<typeof transformIntermediateData>[2],
      ReturnType<typeof transformIntermediateData>
    ]
  >([
    [
      undefined,
      undefined,
      {
        hello: "good"
      }
    ],
    [undefined, "hello", "good"],
    [
      "value",
      undefined,
      {
        value: {
          hello: "good"
        }
      }
    ],
    [
      "value",
      "hello",
      {
        value: "good"
      }
    ]
  ])(
    'transformIntermediateData({hello:"good"}, %j, %j) should return %j',
    (to, from, result) => {
      expect(transformIntermediateData(data, to, from)).toEqual(result);
    }
  );
});

describe("doTransform", () => {
  const data: Parameters<typeof doTransform>[0] = {
    hello: "good"
  };

  it.each<[Parameters<typeof doTransform>[1], ReturnType<typeof doTransform>]>([
    [
      {
        "button.click": {
          args: ["@{hello}"]
        }
      },
      {
        "button.click": {
          args: ["good"]
        }
      }
    ],
    [
      {
        value: "@{notExisted}"
      },
      {
        value: undefined
      }
    ],
    [
      {
        value: "id=@{notExisted}"
      },
      {
        value: "id="
      }
    ]
  ])('doTransform({hello:"good"}, %j, %j) should return %j', (to, result) => {
    expect(doTransform(data, to)).toEqual(result);
  });
});
