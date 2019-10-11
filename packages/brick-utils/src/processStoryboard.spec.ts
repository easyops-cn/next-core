import { Storyboard } from "@easyops/brick-types";
import { processStoryboard } from "./processStoryboard";

describe("processStoryboard", () => {
  it("should work", () => {
    const storyboard: Storyboard = {
      routes: [
        {
          bricks: [
            {
              template: "a"
            },
            {
              brick: "b",
              slots: {
                s: {
                  type: "bricks",
                  bricks: [
                    {
                      template: "c"
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
            template: "d"
          }
          // `bricks` not set
        }
      ]
    } as any;
    const registry = new Map<string, any>([
      [
        "a",
        () => ({
          brick: "a"
        })
      ]
    ]);
    processStoryboard(storyboard, registry);
    expect(storyboard.routes[0].bricks[0]).toEqual({
      brick: "a",
      $template: "a",
      $params: undefined
    });
  });
});
