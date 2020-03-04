import { parseInjectableString } from "./syntax";
import { InjectableString } from "./interfaces";

describe("parseInjectableString", () => {
  it.each<[string, InjectableString]>([
    [
      "",
      {
        type: "InjectableString",
        elements: []
      }
    ],
    [
      "good",
      {
        type: "InjectableString",
        elements: [
          {
            type: "RawString",
            value: "good"
          }
        ]
      }
    ],
    [
      "${{good}}",
      {
        type: "InjectableString",
        elements: [
          {
            type: "RawString",
            value: "${{good}}"
          }
        ]
      }
    ],
    [
      "#{abc}",
      {
        type: "InjectableString",
        elements: [
          {
            type: "RawString",
            value: "#{abc}"
          }
        ]
      }
    ],
    [
      "${}",
      {
        type: "InjectableString",
        elements: [
          {
            type: "Placeholder",
            field: "",
            defaultValue: undefined,
            pipes: [],
            loc: {
              start: 0,
              end: 3
            }
          }
        ]
      }
    ],
    [
      "${QUERY.page}",
      {
        type: "InjectableString",
        elements: [
          {
            type: "Placeholder",
            field: "QUERY.page",
            defaultValue: undefined,
            pipes: [],
            loc: {
              start: 0,
              end: 13
            }
          }
        ]
      }
    ],
    [
      "${QUERY.page=}",
      {
        type: "InjectableString",
        elements: [
          {
            type: "Placeholder",
            field: "QUERY.page",
            defaultValue: "",
            pipes: [],
            loc: {
              start: 0,
              end: 14
            }
          }
        ]
      }
    ],
    [
      "${QUERY.page=-1}",
      {
        type: "InjectableString",
        elements: [
          {
            type: "Placeholder",
            field: "QUERY.page",
            defaultValue: -1,
            pipes: [],
            loc: {
              start: 0,
              end: 16
            }
          }
        ]
      }
    ],
    [
      "asc=${QUERY.asc=true|number}&q=${QUERY.quality=good|split:-}",
      {
        type: "InjectableString",
        elements: [
          {
            type: "RawString",
            value: "asc="
          },
          {
            type: "Placeholder",
            field: "QUERY.asc",
            defaultValue: true,
            pipes: [
              {
                type: "PipeCall",
                identifier: "number",
                parameters: []
              }
            ],
            loc: {
              start: 4,
              end: 28
            }
          },
          {
            type: "RawString",
            value: "&q="
          },
          {
            type: "Placeholder",
            field: "QUERY.quality",
            defaultValue: "good",
            pipes: [
              {
                type: "PipeCall",
                identifier: "split",
                parameters: ["-"]
              }
            ],
            loc: {
              start: 31,
              end: 60
            }
          }
        ]
      }
    ],
    [
      '${ some.field[0].path = ["complex","value\\n"] | map : {"a":-12.34E+5} : true | join : }',
      {
        type: "InjectableString",
        elements: [
          {
            type: "Placeholder",
            field: "some.field[0].path",
            defaultValue: ["complex", "value\n"],
            pipes: [
              {
                type: "PipeCall",
                identifier: "map",
                parameters: [{ a: -12.34e5 }, true]
              },
              {
                type: "PipeCall",
                identifier: "join",
                parameters: [""]
              }
            ],
            loc: {
              start: 0,
              end: 87
            }
          }
        ]
      }
    ]
  ])("parseInjectableString should work for %j", (raw, tree) => {
    expect(parseInjectableString(raw)).toEqual(tree);
  });

  it.each<string>(["${a|b=c}", "${a=[}", "${a|0}", "${a=[{}}{]}"])(
    "should throw when parsing %j",
    raw => {
      expect(() => {
        parseInjectableString(raw);
      }).toThrowError();
    }
  );
});
