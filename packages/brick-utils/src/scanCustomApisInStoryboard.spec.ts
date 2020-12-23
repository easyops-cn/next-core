import { Storyboard } from "@easyops/brick-types";
import {
  scanCustomApisInStoryboard,
  mapCustomApisToNameAndNamespace,
} from "./scanCustomApisInStoryboard";

const customApiA = "easyops.custom_api@awesomeApiA";
const customApiB = "easyops.custom_api@awesomeApiB";
const customApiC = "easyops.custom_api_c@awesomeApiC";
const customApiD = "easyops.custom_api_d@awesomeApiD";
const customApiE = "easyops.custom_api_e@awesomeApiE";
const customApiF = "easyops.custom_api_f@awesomeApiF";
const customApiG = "easyops.custom_api_g@awesomeApiG";
const mockCustomApis = [
  customApiA,
  customApiB,
  customApiC,
  customApiD,
  customApiE,
  customApiF,
  customApiG,
];

describe("scanCustomApisInStoryboard", () => {
  it("should work", () => {
    const storyboard: Storyboard = {
      meta: {
        customTemplates: [
          {
            name: "ct-a",
            bricks: [
              {
                brick: "b-x",
                bg: true,
                properties: {
                  useBrick: {
                    brick: "test-use-brick",
                    events: {
                      click: {
                        useProvider: customApiG,
                      },
                    },
                  },
                },
                context: [
                  {
                    name: "myNewPropContext",
                    property: "title",
                  },
                ],
                events: {
                  click: {
                    action: "history.push",
                  },
                },
                lifeCycle: {
                  onPageLoad: [
                    {
                      useProvider: customApiF,
                      callback: {
                        success: {
                          target: "#id",
                        },
                      },
                    },
                  ],
                  useResolves: [
                    {
                      useProvider: customApiA,
                    },
                    {
                      useProvider: "normal-provider",
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
      routes: [
        {
          path: "/",
          bricks: [
            {
              brick: "div",
              slots: {
                menu: {
                  type: "bricks",
                  bricks: [
                    {
                      brick: "p",
                      lifeCycle: {
                        useResolves: [
                          {
                            useProvider: customApiB,
                          },
                        ],
                      },
                    },
                  ],
                },
                content: {
                  type: "routes",
                  routes: [
                    {
                      path: "/a",
                      bricks: [],
                      redirect: {
                        useProvider: customApiE,
                        transform: {
                          redirect: "${APP.homepage}/product/@{productId}",
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
          context: [
            {
              name: "myNewPropContext",
              resolve: {
                useProvider: customApiC,
                transform: {
                  value: "@{}",
                },
              },
            },
          ],
          defineResolves: [
            {
              id: "cmdb-model-list",
              useProvider: customApiD,
              field: "data.list",
            },
          ],
        },
      ],
    } as any;
    const result = scanCustomApisInStoryboard(storyboard);
    expect(result.length).toBe(mockCustomApis.length);
    expect(result).toEqual(expect.arrayContaining(mockCustomApis));
  });
});

describe("mapCustomApisToNameAndNamespace", () => {
  it("should work", () => {
    const expected = [
      {
        name: "awesomeApiA",
        namespace: "easyops.custom_api",
      },
      {
        name: "awesomeApiB",
        namespace: "easyops.custom_api",
      },
      {
        name: "awesomeApiC",
        namespace: "easyops.custom_api_c",
      },
      {
        name: "awesomeApiD",
        namespace: "easyops.custom_api_d",
      },
      {
        name: "awesomeApiE",
        namespace: "easyops.custom_api_e",
      },
      {
        name: "awesomeApiF",
        namespace: "easyops.custom_api_f",
      },
      {
        name: "awesomeApiG",
        namespace: "easyops.custom_api_g",
      },
    ];
    expect(mapCustomApisToNameAndNamespace(mockCustomApis)).toEqual(expected);
  });
});
