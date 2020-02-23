import { tokenize } from "./lexical";

describe("tokenize", () => {
  it("should work", () => {
    const tokens = tokenize(
      '${ some.field[ 0 ].path = ["complex","value"] | map : 1 : true | slice } ${=oops|a:-0.2E+3}'
    );
    expect(tokens).toEqual([
      {
        type: "BeginPlaceHolder",
        loc: {
          start: 0,
          end: 2
        }
      },
      {
        value: "some.field[ 0 ].path",
        type: "Field"
      },
      {
        type: "BeginDefault"
      },
      {
        value: ["complex", "value"],
        type: "JsonValue"
      },
      {
        type: "BeginPipe"
      },
      {
        value: "map",
        type: "PipeIdentifier"
      },
      {
        type: "BeginPipeParameter"
      },
      {
        value: 1,
        type: "JsonValue"
      },
      {
        type: "BeginPipeParameter"
      },
      {
        value: true,
        type: "JsonValue"
      },
      {
        type: "BeginPipe"
      },
      {
        value: "slice",
        type: "PipeIdentifier"
      },
      {
        type: "EndPlaceHolder",
        loc: {
          start: 71,
          end: 72
        }
      },
      {
        value: " ",
        type: "Raw"
      },
      {
        type: "BeginPlaceHolder",
        loc: {
          start: 73,
          end: 75
        }
      },
      {
        value: "",
        type: "Field"
      },
      {
        type: "BeginDefault"
      },
      {
        value: "oops",
        type: "LegacyLiteral"
      },
      {
        type: "BeginPipe"
      },
      {
        value: "a",
        type: "PipeIdentifier"
      },
      {
        type: "BeginPipeParameter"
      },
      {
        value: -200,
        type: "JsonValue"
      },
      {
        type: "EndPlaceHolder",
        loc: {
          start: 90,
          end: 91
        }
      }
    ]);
  });

  it("should throw", () => {
    expect(() => {
      tokenize("${");
    }).toThrowError();
  });
});
