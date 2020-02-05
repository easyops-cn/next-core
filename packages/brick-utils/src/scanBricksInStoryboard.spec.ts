import { scanBricksInStoryboard } from "./scanBricksInStoryboard";
import { Storyboard } from "@easyops/brick-types";

describe("scanBricksInStoryboard", () => {
  it("should work", () => {
    const storyboard: Storyboard = {
      routes: [
        {
          providers: [
            "p-a",
            {
              brick: "p-b"
            }
          ],
          bricks: [
            {
              brick: "a"
            },
            {
              brick: "b",
              slots: {
                s: {
                  type: "bricks",
                  bricks: [
                    {
                      brick: "c",
                      internalUsedBricks: ["e"]
                    }
                  ]
                },
                l: {
                  type: "routes"
                  // `routes` not set
                }
              }
            }
          ]
        },
        {
          menu: {
            type: "brick",
            brick: "d"
          }
          // `bricks` not set
        },
        {
          bricks: [
            {
              template: "t-a"
            }
          ]
        },
        {
          type: "routes",
          routes: [
            {
              bricks: [
                {
                  brick: "f"
                }
              ]
            }
          ]
        }
      ]
    } as any;
    expect(scanBricksInStoryboard(storyboard)).toEqual([
      "p-a",
      "p-b",
      "a",
      "b",
      "c",
      "e",
      "d",
      "f"
    ]);
  });
});
