import { Storyboard } from "@next-core/brick-types";
import {
  collectBricksByCustomTemplates,
  scanStoryboard,
} from "./scanStoryboard";

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
        providers: [
          "ct-b",
          {
            brick: "b-a",
          },
        ],
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
                    // `internalUsedBricks` will not be counted from now on.
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
                children: [
                  {
                    brick: "b-g",
                  },
                ],
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
    const { bricks, customApis, usedTemplates } = scanStoryboard(storyboard, {
      ignoreBricksInUnusedCustomTemplates: true,
    });
    bricks.sort();
    customApis.sort();
    expect(bricks).toEqual([
      "b-a",
      "b-b",
      "b-c",
      "b-d",
      "b-f",
      "b-g",
      "b-y",
      "u-m",
      "u-n",
      "u-o",
      "u-q",
    ]);
    expect(customApis).toEqual([
      customApiA,
      customApiB,
      customApiC,
      customApiD,
    ]);
    expect(usedTemplates).toEqual(["ct-b"]);
  });

  it("should work for ignoreBricksInUnusedCustomTemplates", () => {
    const { bricks, customApis, usedTemplates } = scanStoryboard(
      storyboard,
      false
    );
    bricks.sort();
    customApis.sort();
    expect(bricks).toEqual([
      "b-a",
      "b-a",
      "b-b",
      "b-c",
      "b-d",
      "b-f",
      "b-g",
      "b-x",
      "b-y",
      "u-m",
      "u-n",
      "u-o",
      "u-q",
    ]);
    expect(customApis).toEqual([
      customApiA,
      customApiB,
      customApiC,
      customApiD,
    ]);
    expect(usedTemplates).toEqual(["ct-b"]);
  });

  it("should collectBricksByCustomTemplates", () => {
    const result = collectBricksByCustomTemplates(
      storyboard.meta.customTemplates
    );
    expect(result).toMatchInlineSnapshot(`
      Map {
        "ct-a" => Array [
          "b-x",
        ],
        "ct-b" => Array [
          "b-y",
          "span",
        ],
      }
    `);
  });
});
