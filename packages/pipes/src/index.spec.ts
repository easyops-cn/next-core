import { processPipes, PipeCall } from "./";

type Identifier = string;
type Parameters = any[];

describe("processPipes", () => {
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => null);
    jest.spyOn(console, "warn").mockImplementation(() => null);
  });

  Date.now = jest.fn(() => +new Date("2019-05-10 17:51:00"));
  const circularValue: any = {};
  circularValue.self = circularValue;
  const cases: [any, string, any][] = [
    [1, "", 1],
    [1, "|string", "1"],
    [undefined, "|string", ""],
    [null, "|string", ""],
    ["1", "|number", 1],
    [1, "|bool", true],
    [0, "|bool", false],
    ["0", "|bool", false],
    ['{"a":1}', "|json", { a: 1 }],
    ["{", "|json", undefined],
    [undefined, "|json", undefined],
    [null, "|json", null],
    [{ a: 1 }, "|jsonStringify", '{\n  "a": 1\n}'],
    [circularValue, "|jsonStringify", undefined],
    [1, "|unknown", undefined],
    [1, "|bool|not", false],
    [0, "|bool|not", true],
    [["a"], "|cmdbInstanceShowName", "a"],
    [["a", "b"], "|cmdbInstanceShowName", "a(b)"],
    [["a", "b", "c"], "|cmdbInstanceShowName", "a(b,c)"],
    [[], "|cmdbInstanceShowName", "-"],
    [[undefined], "|cmdbInstanceShowName", "-"],
    [[undefined, "a"], "|cmdbInstanceShowName", "a"],
    ["asd", "|cmdbInstanceShowName", "asd"],
    [123, "|cmdbInstanceShowName", 123],
    [undefined, "|cmdbInstanceShowName", undefined],
  ];
  it.each(cases)(
    "process %j with pipes %j should return %j",
    (value, rawPipes, result) => {
      expect(
        processPipes(
          value,
          // Compile the pipes first, in a hacking way.
          rawPipes
            ? rawPipes
                .substr(1)
                .split("|")
                .map<PipeCall>((id) => ({
                  type: "PipeCall",
                  identifier: id,
                  parameters: [],
                }))
            : []
        )
      ).toEqual(result);
    }
  );
  it.each([
    [3, "x", []],
    [[{ key: 123 }], "key", [123]],
    [[{ key: { name: "xxx" } }, {}], "key.name", ["xxx", undefined]],
  ])("map should work", (value, param, res) => {
    expect(
      processPipes(value, [
        { type: "PipeCall", identifier: "map", parameters: [param] },
      ])
    ).toEqual(res);
  });

  it.each([
    ["", 1557481860000],
    ["1557417600000", 1557417600000],
    ["now-7d", 1556877060000],
    ["now/d", 1557417600000],
    ["now/y", 1546272000000],
  ])("pipeParseTimeRange should work", (value, res) => {
    expect(
      processPipes(value, [
        { type: "PipeCall", identifier: "parseTimeRange", parameters: [] },
      ])
    ).toEqual(res);
  });

  it("pipeTernary should work", () => {
    expect(
      processPipes(true, [
        {
          type: "PipeCall",
          identifier: "ternary",
          parameters: [{ a: 1 }, { b: 2 }],
        },
      ])
    ).toEqual({ a: 1 });
    expect(
      processPipes(undefined, [
        {
          type: "PipeCall",
          identifier: "ternary",
          parameters: ["foo", "bar"],
        },
      ])
    ).toEqual("bar");
  });

  const stringCases: [any, string, string][] = [
    [null, "substr:1", ""],
    ["01234", "substr:1:3", "123"],
    [1234, "substring:1:3", ""],
    ["01234", "substring:1:3", "12"],
  ];
  it.each(stringCases)(
    "process %j with pipe %j should return %j",
    (value, parameter) => {
      const [pipe, param1, param2] = parameter.split(":");
      expect(
        processPipes(value, [
          {
            type: "PipeCall",
            identifier: pipe,
            parameters: [+param1, +param2],
          },
        ])
      );
    }
  );

  it.each([
    [[1, 2, 3, 4, 5], "slice:1:3", [2, 3]],
    [[1, 2, 3, 4, 5], "slice:1", [2, 3, 4, 5]],
  ])("process %j with pipe %j should return %j", (value, parameter) => {
    const [pipe, param1, param2] = parameter.split(":");
    expect(
      processPipes(value, [
        {
          type: "PipeCall",
          identifier: pipe,
          parameters: [+param1, +param2],
        },
      ])
    );
  });

  it.each([
    [
      [
        { a: "3", b: "1" },
        { a: "1", b: "2" },
        { a: "1", b: "3" },
      ],
      "a",
      "groupIndex",
      [
        { a: "3", b: "1", groupIndex: 1 },
        { a: "1", b: "2", groupIndex: 0 },
        { a: "1", b: "3", groupIndex: 0 },
      ],
    ],
    [
      [{ a: "3" }, { a: "1" }],
      undefined,
      "groupIndex",
      [{ a: "3" }, { a: "1" }],
    ],
    [[{ a: "3" }, { a: "1" }], "a", undefined, [{ a: "3" }, { a: "1" }]],
  ])("groupByToIndex should work", (value, groupField, targetField, res) => {
    expect(
      processPipes(value, [
        {
          type: "PipeCall",
          identifier: "groupByToIndex",
          parameters: [groupField, targetField],
        },
      ])
    ).toEqual(res);
  });

  const casesWithSingleParameter: [any, string, any][] = [
    [{ name: "foo" }, "|get:name", "foo"],
    ["bar", "|equal:bar", true],
    ["hello, world", "|split:, ", ["hello", "world"]],
    [null, "|split:, ", []],
    [[1, 2, 3], "|join:;", "1;2;3"],
    [undefined, "|join:;", ""],
    [[1, 2, 3], "|includes:0", false],
    [["foo", "bar"], "|includes:foo", true],
    [1582877669000, "|datetime:YYYY-MM-DD", "2020-02-28"],
    ["2020/02/28 17:14", "|datetime:YYYY-MM-DD", "2020-02-28"],
    [24, "|add:0", "240"],
    [24, "|subtract:1", 23],
    [24, "|multiply:1.5", 36],
    [24, "|divide:0", Infinity],
    [24, "|divide:3", 8],
    [
      ["one", "two", "three"],
      "|groupBy:length",
      { 3: ["one", "two"], 5: ["three"] },
    ],
    [["one", "two", "three"], "|countBy:length", { 3: 2, 5: 1 }],
    [
      [{ objectId: "HOST" }, { objectId: "APP" }],
      "|keyBy:objectId",
      { HOST: { objectId: "HOST" }, APP: { objectId: "APP" } },
    ],
  ];
  it.each(casesWithSingleParameter)(
    "process %j with pipes %j should return %j",
    (value, rawPipes, result) => {
      // Compile the pipes first, in a hacking way.
      const [identifier, parameter] = rawPipes.substr(1).split(":", 2);
      const parameters: (number | string)[] = [parameter];
      const pipeCalls: PipeCall[] = [
        {
          type: "PipeCall",
          identifier,
          parameters,
        },
      ];
      expect(processPipes(value, pipeCalls)).toEqual(result);
    }
  );

  const yamlCases: [any, string, any][] = [
    [1, "yaml", 1],
    ["age: 17", "yaml", { age: 17 }],
    ["r: 3: * 8", "yaml", undefined],
    ["3", "yamlStringify", "'3'\n"],
    [{ name: "foo" }, "yamlStringify", "name: foo\n"],
    [/re/, "yamlStringify", ""],
  ];
  it.each(yamlCases)(
    "process %j with pipe %j should return %j",
    (value, pipe, result) => {
      expect(
        processPipes(value, [
          {
            type: "PipeCall",
            identifier: pipe,
            parameters: [],
          },
        ])
      ).toEqual(result);
    }
  );

  it.each([
    [
      ["1", "2", "1", "1"],
      ["1", "2"],
    ],
    [
      [1, 2],
      [1, 2],
    ],
  ])("uniq should work", (value, res) => {
    expect(
      processPipes(value, [
        { type: "PipeCall", identifier: "uniq", parameters: [] },
      ])
    ).toEqual(res);
  });

  const unitFormatParams: [any, [Identifier, Parameters], any][] = [
    [1000.0, ["unitFormat", ["KBps"]], ["1.00", "MBps"]],
    [1000.0, ["unitFormat", ["KBps", 3]], ["1.000", "MBps"]],
  ];
  it.each(unitFormatParams)(
    "pipeUnitFormat should work",
    (value, [identifier, parameters], result) => {
      expect(
        processPipes(value, [
          {
            type: "PipeCall",
            identifier,
            parameters,
          },
        ])
      ).toEqual(result);
    }
  );

  const paramCases: [any, [Identifier, Parameters], any][] = [
    [null, ["mapToArray", ["", ""]], []],
    ["23", ["mapToArray", ["", ""]], []],
    [
      { HOST: "主机", APP: "应用" },
      ["mapToArray", ["id", "label"]],
      [
        { id: "HOST", label: "主机" },
        { id: "APP", label: "应用" },
      ],
    ],
    [
      [
        { user: "x1", active: true },
        { user: "x2", active: true },
      ],
      ["find", [{ user: "x1" }]],
      { user: "x1", active: true },
    ],
    [
      [
        { user: "x1", active: true },
        { user: "x2", active: true },
      ],
      ["findLast", ["active"]],
      { user: "x2", active: true },
    ],
    [
      [
        { user: "x1", active: true },
        { user: "x2", active: true },
      ],
      ["findIndex", ["active"]],
      0,
    ],
    [
      [
        { user: "x1", active: true },
        { user: "x2", active: true },
      ],
      ["findLastIndex", ["active"]],
      1,
    ],
    [null, ["sort", []], []],
    [
      [{ user: "c" }, { user: "b" }],
      ["sort", ["user"]],
      [{ user: "b" }, { user: "c" }],
    ],
    [null, ["reverse", []], []],
    [
      [3, 2, 1],
      ["reverse", []],
      [1, 2, 3],
    ],
    [null, ["nullish", ["-"]], "-"],
    ["", ["nullish", ["-"]], ""],
    ["test", ["nullish", ["-"]], "test"],
    // now is 2019-05-10 17:51:00
    ["2019-05-10 17:21:00", ["deltaTime", []], "30 minutes ago"],
    ["2019-05-10 18:51:00", ["deltaTime", []], "in an hour"],
    ["", ["deltaTime", []], ""],
    [
      { startTime: "2019-05-10", endTime: "2019-06-10" },
      ["deltaTime", [false]],
      "a month",
    ],
    [{ startTime: "2019-05-10 17:48" }, ["deltaTime", [false]], "3 minutes"],
    [{ endTime: 1557482040000 }, ["deltaTime", [false]], "3 minutes"],
  ];
  it.each(paramCases)(
    "process %j with %j should return %j",
    (value, [identifier, parameters], result) => {
      expect(
        processPipes(value, [
          {
            type: "PipeCall",
            identifier,
            parameters,
          },
        ])
      ).toEqual(result);
    }
  );
});

it.each([
  [
    {
      topic_vertices: [
        {
          instanceId: "1",
          name: "1",
        },
        {
          instanceId: "2",
          name: "2",
        },
      ],
      vertices: [
        {
          instanceId: "3",
          name: "3",
        },
        {
          instanceId: "4",
          name: "4",
        },
        {
          instanceId: "5",
          name: "5",
        },
        {
          instanceId: "6",
          name: "6",
        },
      ],
      edges: [
        {
          out: "1",
          in: "3",
          out_name: "children",
        },
        {
          out: "1",
          in: "4",
          out_name: "children",
        },
        {
          out: "3",
          in: "5",
          out_name: "children",
        },
        {
          out: "2",
          in: "6",
          out_name: "children",
        },
      ],
    },
    undefined,
    [
      {
        instanceId: "1",
        name: "1",
        children: [
          {
            instanceId: "3",
            name: "3",
            children: [
              {
                instanceId: "5",
                name: "5",
              },
            ],
          },
          {
            instanceId: "4",
            name: "4",
          },
        ],
      },
      {
        instanceId: "2",
        name: "2",
        children: [
          {
            instanceId: "6",
            name: "6",
          },
        ],
      },
    ],
  ],
  [undefined, undefined, []],
  [
    {
      topic_vertices: [
        {
          instanceId: "1",
          name: "1",
        },
      ],
      vertices: [
        {
          instanceId: "2",
          sort: 3,
          name: "2",
        },
        {
          instanceId: "3",
          sort: 1,
          name: "3",
        },
        {
          instanceId: "4",
          sort: 2,
          name: "4",
        },
      ],
      edges: [
        {
          out: "1",
          in: "2",
          out_name: "children",
        },
        {
          out: "1",
          in: "3",
          out_name: "children",
        },
        {
          out: "1",
          in: "4",
          out_name: "children",
        },
      ],
    },
    {
      sort: {
        key: "sort",
        order: 1,
      },
    },
    [
      {
        instanceId: "1",
        name: "1",
        children: [
          {
            instanceId: "3",
            sort: 1,
            name: "3",
          },
          {
            instanceId: "4",
            sort: 2,
            name: "4",
          },
          {
            instanceId: "2",
            sort: 3,
            name: "2",
          },
        ],
      },
    ],
  ],
])("graphTree should work", (value, parameters, res) => {
  expect(
    processPipes(value, [
      {
        type: "PipeCall",
        identifier: "graphTree",
        parameters: [parameters],
      },
    ])
  ).toEqual(res);
});
