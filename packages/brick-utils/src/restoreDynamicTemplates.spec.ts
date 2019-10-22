import { Storyboard, SlotConfOfBricks } from "@easyops/brick-types";
import { restoreDynamicTemplates } from "./restoreDynamicTemplates";

describe("restoreDynamicTemplates", () => {
  it("should work", () => {
    const storyboard: Storyboard = {
      routes: [
        {
          bricks: [
            {
              $$template: "a",
              $$params: {
                hello: "world"
              },
              $$lifeCycle: {
                useResolves: [{}]
              },
              $$resolved: true,
              brick: "a"
            },
            {
              brick: "b",
              slots: {
                s: {
                  type: "bricks",
                  bricks: [
                    {
                      $$template: "c",
                      $$params: {
                        hello: "world"
                      },
                      $$lifeCycle: {
                        useResolves: [{}]
                      }
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
    restoreDynamicTemplates(storyboard);
    expect(storyboard.routes[0].bricks[0]).toEqual({
      template: "a",
      params: {
        hello: "world"
      },
      lifeCycle: {
        useResolves: [{}]
      }
    });
    expect(
      (storyboard.routes[0].bricks[1].slots.s as SlotConfOfBricks).bricks[0]
    ).toEqual({
      template: "c",
      params: {
        hello: "world"
      },
      lifeCycle: {
        useResolves: [{}]
      }
    });
  });
});
