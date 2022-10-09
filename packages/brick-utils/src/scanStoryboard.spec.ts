import { Storyboard } from "@next-core/brick-types";
import { scanStoryboard } from "./scanStoryboard";

describe("scanStoryboard", () => {
  const customApiA = "easyops.custom_api@awesomeApiA";
  const customApiB = "easyops.custom_api@awesomeApiB";
  const customApiC = "easyops.custom_api_c@awesomeApiC";
  const customApiD = "easyops.custom_api_c@awesomeApiD";
  const storyboard: Storyboard = {
    meta: {
      customTemplates: [
        {
          name: "ct-a",
          bricks: [
            {
              brick: "b-x",
            },
          ],
        },
        {
          name: "ct-b",
          bricks: [
            {
              brick: "b-y",
            },
            {
              brick: "span",
            },
          ],
        },
      ],
    },
    routes: [
      {
        defineResolves: [
          {
            useProvider: "u-q",
          },
          {
            useProvider: customApiA,
          },
        ],
        bricks: [
          {
            brick: "b-a",
            lifeCycle: {
              useResolves: [
                {
                  useProvider: customApiB,
                },
              ],
            },
          },
          {
            brick: "b-b",
            slots: {
              s: {
                type: "bricks",
                bricks: [
                  {
                    brick: "b-c",
                    internalUsedBricks: ["b-e"],
                  },
                ],
              },
              l: {
                type: "routes",
              },
            },
          },
          {
            brick: "b-d",
            properties: {
              useBackend: {
                provider: customApiD,
              },
              useBrick: {
                brick: "b-f",
              },
            },
          },
        ],
        menu: {
          type: "resolve",
          resolve: {
            useProvider: customApiC,
          },
        },
        redirect: {
          useProvider: "u-m",
        },
        context: [
          {
            resolve: {
              useProvider: "u-n",
            },
          },
          {
            name: "hello",
            onChange: [{ useProvider: "u-o" }],
          },
        ],
      },
    ],
  } as any;

  it("should work", () => {
    expect(scanStoryboard(storyboard)).toEqual({
      bricks: [
        "u-n",
        "u-o",
        "u-m",
        "u-q",
        "b-a",
        "b-b",
        "b-c",
        "b-e",
        "b-d",
        "b-f",
        "b-x",
        "b-y",
      ],
      customApis: [customApiA, customApiB, customApiD, customApiC],
    });
  });
});
