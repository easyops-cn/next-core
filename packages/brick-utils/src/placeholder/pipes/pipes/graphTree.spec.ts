import { graphTree } from "./graphTree";

describe("graphTree", () => {
  const testCases: [
    Parameters<typeof graphTree>,
    ReturnType<typeof graphTree>
  ][] = [
    [
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
      ],
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
    [[undefined], []],
    [
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
      ],
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
  ];
  test.each(testCases)("graphTree(...%j) should return %j", (input, output) => {
    expect(graphTree(...input)).toEqual(output);
  });
});
