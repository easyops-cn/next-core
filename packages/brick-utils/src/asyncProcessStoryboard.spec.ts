import {
  Storyboard,
  TemplatePackage,
  SlotConfOfBricks,
  RouteConfOfBricks,
} from "@easyops/brick-types";
import { asyncProcessStoryboard } from "./asyncProcessStoryboard";
import { loadScript } from "./loadScript";
import { hasOwnProperty } from "./hasOwnProperty";

jest.mock("./loadScript");

describe("asyncProcessStoryboard", () => {
  it("should work", async () => {
    const storyboard: Storyboard = {
      routes: [
        {
          bricks: [
            {
              if: "${FLAGS.testing}",
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
                  template: "b",
                },
              ],
            },
          },
        }),
      ],
    ]);
    const templatePackages: TemplatePackage[] = [
      {
        templates: ["b"],
        filePath: "b.js",
      },
    ];
    (loadScript as jest.Mock).mockImplementationOnce(() => {
      registry.set("b", () => ({
        brick: "b",
      }));
      registry.set("c", () => ({
        template: "b",
      }));
    });
    await asyncProcessStoryboard(storyboard, registry, templatePackages);
    expect(loadScript as jest.Mock).toBeCalledWith(["b.js"]);
    expect((storyboard.routes[0] as RouteConfOfBricks).bricks[0]).toMatchObject(
      {
        brick: "a",
        $$template: "a",
        $$params: undefined,
        $$if: "${FLAGS.testing}",
      }
    );
    // Cover when a template returns a template.
    const innerBrick = ((storyboard.routes[0] as RouteConfOfBricks).bricks[1]
      .slots.s as SlotConfOfBricks).bricks[0];
    expect(innerBrick).toMatchObject({
      brick: "b",
      $$template: "c",
      $$params: undefined,
    });
    expect(hasOwnProperty(innerBrick, "$$if")).toBe(false);
  });
});
