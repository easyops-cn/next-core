import {
  Storyboard,
  TemplatePackage,
  SlotConfOfBricks,
  RouteConfOfBricks,
} from "@next-core/brick-types";
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
              template: "a.template-a",
            },
            {
              brick: "b.brick-b",
              slots: {
                s: {
                  type: "bricks",
                  bricks: [
                    {
                      template: "c.template-c",
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
            template: "d.template-d",
          },
          // `bricks` not set
        },
        {
          type: "routes",
          routes: [
            {
              bricks: [
                {
                  template: "f.template-f",
                },
              ],
            },
          ],
        },
      ],
    } as any;
    const registry = new Map<string, any>([
      [
        "a.template-a",
        () => ({
          brick: "a.brick-a",
          slots: {
            "": {
              type: "bricks",
              bricks: [
                {
                  template: "b.template-b",
                },
              ],
            },
          },
        }),
      ],
    ]);
    const templatePackages: TemplatePackage[] = [
      {
        filePath: "templates/b/dist/b.js",
      },
      {
        filePath: "templates/d/dist/d.js",
      },
      {
        filePath: "templates/f/dist/f.js",
      },
    ];
    (loadScript as jest.Mock).mockImplementationOnce(() => {
      registry.set("b.template-b", () => ({
        brick: "b.brick-b",
      }));
      registry.set("c.template-c", () => ({
        template: "b.template-b",
      }));
    });
    await asyncProcessStoryboard(storyboard, registry, templatePackages);
    expect(loadScript as jest.Mock).toBeCalledWith(
      ["templates/b/dist/b.js"],
      undefined
    );
    expect((storyboard.routes[0] as RouteConfOfBricks).bricks[0]).toMatchObject(
      {
        brick: "a.brick-a",
        $$template: "a.template-a",
        $$params: undefined,
        $$if: "${FLAGS.testing}",
      }
    );
    // Cover when a template returns a template.
    const innerBrick = (
      (storyboard.routes[0] as RouteConfOfBricks).bricks[1].slots
        .s as SlotConfOfBricks
    ).bricks[0];
    expect(innerBrick).toMatchObject({
      brick: "b.brick-b",
      $$template: "c.template-c",
      $$params: undefined,
    });
    // expect(hasOwnProperty(innerBrick, "$$if")).toBe(false);
  });
});
