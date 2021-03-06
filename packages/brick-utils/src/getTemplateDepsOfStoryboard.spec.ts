import { Storyboard } from "@next-core/brick-types";
import {
  scanTemplatesInStoryboard,
  getTemplateDepsOfStoryboard,
} from "./getTemplateDepsOfStoryboard";

describe("scanTemplatesInStoryboard", () => {
  it("should work", () => {
    const storyboard: Storyboard = {
      routes: [
        {
          bricks: [
            {
              template: "a",
            },
            {
              brick: "b",
              slots: {
                s: {
                  type: "bricks",
                  bricks: [
                    {
                      template: "c",
                      internalUsedTemplates: ["e"],
                    },
                  ],
                },
                l: {
                  type: "routes",
                  // `routes` not set
                },
              },
            },
          ],
        },
        {
          menu: {
            type: "brick",
            template: "d",
          },
          // `bricks` not set
        },
        {
          type: "routes",
          routes: [
            {
              bricks: [
                {
                  template: "f",
                },
              ],
            },
          ],
        },
      ],
    } as any;
    expect(scanTemplatesInStoryboard(storyboard)).toEqual([
      "a",
      "c",
      "e",
      "d",
      "f",
    ]);
  });
});

describe("getTemplateDepsOfStoryboard", () => {
  it("should work", () => {
    const storyboard: Storyboard = {
      routes: [
        {
          bricks: [
            {
              template: "a",
            },
            {
              brick: "b",
              slots: {
                s: {
                  type: "bricks",
                  bricks: [
                    {
                      template: "c",
                      internalUsedTemplates: ["e"],
                    },
                  ],
                },
                l: {
                  type: "routes",
                  // `routes` not set
                },
              },
            },
          ],
        },
        {
          menu: {
            type: "brick",
            template: "d",
          },
          // `bricks` not set
        },
        {
          type: "routes",
          routes: [
            {
              bricks: [
                {
                  template: "f",
                },
              ],
            },
          ],
        },
      ],
    } as any;
    expect(
      getTemplateDepsOfStoryboard(storyboard, [
        {
          templates: ["a"],
          filePath: "a.js",
        },
      ])
    ).toEqual(["a.js"]);
  });
});
