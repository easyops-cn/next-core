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
          required: true,
          value: "@{}"
        }
      },
      {
        label: "hello",
        required: true,
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
          users: "hi: @{}"
        }
      },
      {
        users: ["hi: eve", "hi: wall-e"]
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
    (transform, transformFrom, result) => {
      expect(transformIntermediateData(data, transform, transformFrom)).toEqual(
        result
      );
    }
  );
});

describe("doTransform", () => {
  const data: Parameters<typeof doTransform>[0] = {
    hello: "good"
  };

  it.each<
    [
      Parameters<typeof doTransform>[1],
      Parameters<typeof doTransform>[2],
      ReturnType<typeof doTransform>
    ]
  >([
    [
      {
        "button.click": {
          args: ["@{hello}"]
        }
      },
      undefined,
      {
        "button.click": {
          args: ["good"]
        }
      }
    ]
  ])(
    'doTransform({hello:"good"}, %j, %j) should return %j',
    (transform, transformFrom, result) => {
      expect(doTransform(data, transform, transformFrom)).toEqual(result);
    }
  );
});
