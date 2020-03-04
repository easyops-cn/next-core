import { tokenize } from "./lexical";

describe("tokenize", () => {
  it("should work", () => {
    const tokens = tokenize(
      '${ some.field[0].path = ["complex","value"] | map : id : true | slice } ${=oops|a:-0.2E+3}'
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
        value: "some.field[0].path",
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
        value: "id",
        type: "LiteralString"
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
          start: 70,
          end: 71
        }
      },
      {
        value: " ",
        type: "Raw"
      },
      {
        type: "BeginPlaceHolder",
        loc: {
          start: 72,
          end: 74
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
        type: "LiteralString"
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
          start: 89,
          end: 90
        }
      }
    ]);
  });

  it("should work for `${{...}}`", () => {
    expect(tokenize("${{appId}}")).toEqual([
      {
        type: "Raw",
        value: "${{appId}}"
      }
    ]);
  });

  it("should throw", () => {
    expect(() => {
      tokenize("${");
    }).toThrowError();
  });
});
