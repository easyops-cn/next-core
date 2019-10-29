import {
  Storyboard,
  TemplatePackage,
  SlotConfOfBricks
} from "@easyops/brick-types";
import { asyncProcessStoryboard } from "./asyncProcessStoryboard";
import { loadScript } from "./loadScript";

jest.mock("./loadScript");

describe("asyncProcessStoryboard", () => {
  it("should work", async () => {
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
          brick: "a",
          slots: {
            "": {
              type: "bricks",
              bricks: [
                {
                  template: "b"
                }
              ]
            }
          }
        })
      ]
    ]);
    const templatePackages: TemplatePackage[] = [
      {
        templates: ["b"],
        filePath: "b.js"
      }
    ];
    (loadScript as jest.Mock).mockImplementationOnce(() => {
      registry.set("b", () => ({
        brick: "b"
      }));
      registry.set("c", () => ({
        template: "b"
      }));
    });
    await asyncProcessStoryboard(storyboard, registry, templatePackages);
    expect(loadScript as jest.Mock).toBeCalledWith(["b.js"]);
    expect(storyboard.routes[0].bricks[0]).toMatchObject({
      brick: "a",
      $$template: "a",
      $$params: {}
    });
    // Cover when a template returns a template.
    expect(
      (storyboard.routes[0].bricks[1].slots.s as SlotConfOfBricks).bricks[0]
    ).toMatchObject({
      brick: "b",
      $$template: "c",
      $$params: {}
    });
  });
});
