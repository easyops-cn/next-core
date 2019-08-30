import { scanBricksInStoryboard } from "./scanBricksInStoryboard";
import { Storyboard } from "@easyops/brick-types";

describe("scanBricksInStoryboard", () => {
  it("should work", () => {
    const storyboard: Storyboard = {
      routes: [
        {
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
                      brick: "c"
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
        }
      ]
    } as any;
    expect(scanBricksInStoryboard(storyboard)).toEqual(["a", "b", "c", "d"]);
  });
});
