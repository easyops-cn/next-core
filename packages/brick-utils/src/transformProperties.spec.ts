import { transformProperties } from "./transformProperties";
import { GeneralTransform } from "@easyops/brick-types";

interface Args {
  props: Record<string, any>;
  data: any;
  transformFrom?: string | string[];
  transform?: GeneralTransform;
}

describe("transformProperties", () => {
  it.each<[Args, Record<string, any>]>([
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
