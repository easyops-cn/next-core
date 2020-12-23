import { Storyboard } from "@easyops/brick-types";
import { scanStoryboard } from "./scanStoryboard";

describe("scanStoryboard", () => {
  const customApiA = "easyops.custom_api@awesomeApiA";
  const customApiB = "easyops.custom_api@awesomeApiB";
  const customApiC = "easyops.custom_api_c@awesomeApiC";
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
        ],
      },
    ],
  } as any;

  it("should work", () => {
    expect(scanStoryboard(storyboard)).toEqual({
      bricks: ["u-n", "u-m", "u-q", "b-a", "b-b", "b-c", "b-e", "b-x", "b-y"],
      customApis: [customApiA, customApiB, customApiC],
    });
  });
});
