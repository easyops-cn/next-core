import { snippetEvaluate } from "./snippetEvaluate";

describe("snippetEvaluate processor", () => {
  describe("snippetEvaluate should work", () => {
    it.each([
      [
        {
          brick: "presentational-bricks.brick-table[normal]",
          params: {
            test: {
              type: "string",
              defaultValue: "come from snippetParams",
            },
          },
          data: [
            {
              name: "testGood",
              value: "<%! SNIPPET_PARAMS.test %>",
            },
            {
              name: "dataSourceList",
              resolve: {
                useProvider: "providers-of-cmdb.instance-api-post-search",
                args: [
                  "APP",
                  {
                    fields: {
                      "*": true,
                    },
                  },
                ],
              },
            },
          ],
          bricks: [
            {
              brick: "presentational-bricks.brick-table",
              properties: {
                columns: [
                  {
                    title: "Name",
                    dataIndex: "name",
                  },
                  {
                    title: "ctime",
                    dataIndex: "ctime",
                    useBrick: [
                      {
                        brick: "span",
                        properties: {
                          textContent: "<% DATA.cellData %>",
                        },
                        events: {
                          click: [
                            {
                              action: "<%! DATA_UPDATE_METHOD %>",
                              args: ["test", "new value"],
                            },
                          ],
                        },
                      },
                    ],
                  },
                  {
                    title: "test",
                    dataIndex: "test",
                    useBrick: [
                      {
                        brick: "span",
                        properties: {
                          textContent: "<%! SNIPPET_PARAMS.test %>",
                          dataType: "<%! SNIPPET_ROOT_TYPE %>",
                        },
                      },
                    ],
                  },
                ],

                dataSource: "<%@= CTX_OR_STATE.dataSourceList %>",
              },
            },
          ],
        },
        {
          rootType: "route",
          rootInstanceId: "abc123",
          dataList: [],
          declareParams: {
            test: {
              type: "string",
              defaultValue: "come from snippetParams",
            },
          },
          inputParams: {
            test: "hello",
          },
        },
        {
          brick: "presentational-bricks.brick-table[normal]",
          bricks: [
            {
              brick: "presentational-bricks.brick-table",
              properties: {
                columns: [
                  { dataIndex: "name", title: "Name" },
                  {
                    dataIndex: "ctime",
                    title: "ctime",
                    useBrick: [
                      {
                        brick: "span",
                        properties: { textContent: "<% DATA.cellData %>" },
                        events: {
                          click: [
                            {
                              action: "context.replace",
                              args: ["test", "new value"],
                            },
                          ],
                        },
                      },
                    ],
                  },
                  {
                    dataIndex: "test",
                    title: "test",
                    useBrick: [
                      {
                        brick: "span",
                        properties: { textContent: "hello", dataType: "route" },
                      },
                    ],
                  },
                ],
                dataSource: "<%= CTX.dataSourceList %>",
              },
            },
          ],
          data: [
            { name: "testGood", value: "hello" },
            {
              name: "dataSourceList",
              resolve: {
                args: ["APP", { fields: { "*": true } }],
                useProvider: "providers-of-cmdb.instance-api-post-search",
              },
            },
          ],
          params: {
            test: { defaultValue: "come from snippetParams", type: "string" },
          },
        },
      ],
      [
        {
          brick: "presentational-bricks.brick-table[normal]",
          params: {
            test: {
              type: "string",
              defaultValue: "come from snippetParams",
            },
          },
          data: [
            {
              name: "testGood",
              value: "<%! SNIPPET_PARAMS.test %>",
            },
          ],
          bricks: [
            {
              brick: "presentational-bricks.brick-table",
              properties: {
                columns: [
                  {
                    title: "Name",
                    dataIndex: "name",
                  },
                  {
                    title: "ctime",
                    dataIndex: "ctime",
                    useBrick: [
                      {
                        brick: "span",
                        properties: {
                          textContent: "<% DATA.cellData %>",
                        },
                        events: {
                          click: [
                            {
                              action: "<%! DATA_UPDATE_METHOD %>",
                              args: ["test", "new value"],
                            },
                          ],
                        },
                      },
                    ],
                  },
                ],

                dataSource: "<%@= CTX_OR_STATE.dataSourceList %>",
              },
            },
          ],
        },
        {
          rootType: "template",
          rootInstanceId: "abc123",
          dataList: [],
          declareParams: {
            test: {
              type: "string",
              defaultValue: "come from snippetParams",
            },
          },
          inputParams: {
            test: "hello",
          },
        },
        {
          brick: "presentational-bricks.brick-table[normal]",
          bricks: [
            {
              brick: "presentational-bricks.brick-table",
              properties: {
                columns: [
                  { dataIndex: "name", title: "Name" },
                  {
                    dataIndex: "ctime",
                    title: "ctime",
                    useBrick: [
                      {
                        brick: "span",
                        events: {
                          click: [
                            {
                              action: "state.update",
                              args: ["test", "new value"],
                            },
                          ],
                        },
                        properties: { textContent: "<% DATA.cellData %>" },
                      },
                    ],
                  },
                ],
                dataSource: "<%= STATE.dataSourceList %>",
              },
            },
          ],
          data: [{ name: "testGood", value: "hello" }],
          params: {
            test: { defaultValue: "come from snippetParams", type: "string" },
          },
        },
      ],
      [
        {
          brick: "presentational-bricks.brick-table[normal]",
          params: {
            test: {
              type: "string",
              defaultValue: "come from snippetParams",
            },
          },
          data: [
            {
              name: "testGood",
              value: "<%! SNIPPET_PARAMS.test %>",
            },
            {
              name: "dataSourceList",
              resolve: {
                useProvider: "providers-of-cmdb.instance-api-post-search",
                args: [
                  "APP",
                  {
                    fields: {
                      "*": true,
                    },
                  },
                ],
              },
            },
          ],
          bricks: [
            {
              brick: "presentational-bricks.brick-table",
              properties: {
                columns: [
                  {
                    title: "Name",
                    dataIndex: "name",
                  },
                  {
                    title: "ctime",
                    dataIndex: "ctime",
                    useBrick: [
                      {
                        brick: "span",
                        properties: {
                          textContent: "<% DATA.cellData %>",
                        },
                      },
                    ],
                  },
                  {
                    title: "test",
                    dataIndex: "test",
                    useBrick: [
                      {
                        brick: "span",
                        properties: {
                          textContent: "<%! SNIPPET_PARAMS['test'] %>",
                        },
                      },
                    ],
                  },
                ],

                dataSource: "<%@ CTX_OR_STATE.dataSourceList %>",
              },
            },
          ],
        },
        {
          rootType: "template",
          rootInstanceId: "abc123",
          dataList: [{ name: "count" }],
          declareParams: {
            test: {
              type: "string",
              defaultValue: "come from snippetParams",
            },
          },
          inputParams: {
            test: "hello",
          },
        },
        {
          brick: "presentational-bricks.brick-table[normal]",
          bricks: [
            {
              brick: "presentational-bricks.brick-table",
              properties: {
                columns: [
                  { dataIndex: "name", title: "Name" },
                  {
                    dataIndex: "ctime",
                    title: "ctime",
                    useBrick: [
                      {
                        brick: "span",
                        properties: { textContent: "<% DATA.cellData %>" },
                      },
                    ],
                  },
                  {
                    dataIndex: "test",
                    title: "test",
                    useBrick: [
                      { brick: "span", properties: { textContent: "hello" } },
                    ],
                  },
                ],
                dataSource: "<% STATE.dataSourceList %>",
              },
            },
          ],
          data: [
            { name: "testGood", value: "hello" },
            {
              name: "dataSourceList",
              resolve: {
                args: ["APP", { fields: { "*": true } }],
                useProvider: "providers-of-cmdb.instance-api-post-search",
              },
            },
          ],
          params: {
            test: { defaultValue: "come from snippetParams", type: "string" },
          },
        },
      ],
    ])("should work", (brickConf, context, result) => {
      expect(snippetEvaluate(brickConf, context)).toEqual(result);
    });

    it("should throw specific error", () => {
      const brickConf = {
        brick: "presentational-bricks.brick-table[normal]",
        params: {
          test: {
            type: "string",
            defaultValue: "come from snippetParams",
          },
        },
        data: [
          {
            name: "testGood",
            value: "<%! SNIPPET_PARAMS.test %>",
          },
          {
            name: "dataSourceList",
            resolve: {
              useProvider: "providers-of-cmdb.instance-api-post-search",
              args: [
                "APP",
                {
                  fields: {
                    "*": true,
                  },
                },
              ],
            },
          },
        ],
        bricks: [
          {
            brick: "presentational-bricks.brick-table",
            properties: {
              columns: [
                {
                  title: "Name",
                  dataIndex: "name",
                },
                {
                  title: "ctime",
                  dataIndex: "ctime",
                  useBrick: [
                    {
                      brick: "span",
                      properties: {
                        textContent: "<% DATA.cellData %>",
                      },
                    },
                  ],
                },
                {
                  title: "test",
                  dataIndex: "test",
                  useBrick: [
                    {
                      brick: "span",
                      properties: {
                        textContent: "<%! SNIPPET_PARAMS.test %>",
                      },
                    },
                  ],
                },
              ],

              dataSource: "<%@ CTX_OR_STATE.dataSourceList %>",
            },
          },
        ],
      };

      expect(() => snippetEvaluate(brickConf, {})).toThrowError(
        "Missing type of test in snippet params"
      );

      expect(() =>
        snippetEvaluate(brickConf, {
          declareParams: { test: { type: "object" } },
        })
      ).toThrowError(
        "The object type is not supported of test in snippet params"
      );

      expect(() =>
        snippetEvaluate(brickConf, {
          inputParams: { test: 123 },
          declareParams: { test: { type: "string" } },
        })
      ).toThrowError(
        "The test is declared as type string, but it is receiving a value of type number"
      );
    });
  });
});
