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
              template: "a.templateA",
            },
            {
              brick: "b.brickA",
              slots: {
                s: {
                  type: "bricks",
                  bricks: [
                    {
                      template: "c.templateB",
                      internalUsedTemplates: ["e.templateC"],
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
            template: "d.templateD",
          },
          // `bricks` not set
        },
        {
          type: "routes",
          routes: [
            {
              bricks: [
                {
                  template: "f.templateE",
                },
              ],
            },
          ],
        },
      ],
    } as any;
    expect(scanTemplatesInStoryboard(storyboard)).toEqual([
      "a.templateA",
      "c.templateB",
      "e.templateC",
      "d.templateD",
      "f.templateE",
    ]);
  });
});

describe("getTemplateDepsOfStoryboard", () => {
  it("should work", () => {
    const spyConsoleError = jest
      .spyOn(console, "error")
      .mockReturnValue(undefined);
    const storyboard: Storyboard = {
      routes: [
        {
          bricks: [
            {
              template: "a.templateA",
            },
            {
              brick: "b.brickA",
              slots: {
                s: {
                  type: "bricks",
                  bricks: [
                    {
                      template: "c.templateB",
                      internalUsedTemplates: ["e.templateC"],
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
            template: "d.templateD",
          },
          // `bricks` not set
        },
        {
          type: "routes",
          routes: [
            {
              bricks: [
                {
                  template: "f.templateE",
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
          filePath: "invalid/template/x.js",
        },
        {
          templates: ["a.templateA"],
          filePath: "templates/a/dist/a.js",
        },
        {
          filePath: "templates/b/dist/b.js",
        },
        {
          filePath: "templates/c/dist/c.js",
        },
        {
          filePath: "templates/d/dist/d.js",
        },
        {
          filePath: "templates/e/dist/e.js",
        },
        {
          filePath: "templates/k/dist/k.js",
        },
      ])
    ).toEqual([
      "templates/a/dist/a.js",
      "templates/c/dist/c.js",
      "templates/e/dist/e.js",
      "templates/d/dist/d.js",
    ]);

    expect(spyConsoleError.mock.calls[0][0]).toEqual(
      "the file path of template is `invalid/template/x.js` and it is non-standard package path"
    );

    expect(spyConsoleError.mock.calls[1][0]).toEqual(
      "the name of template is `f.templateE` and it don't match any template package"
    );

    spyConsoleError.mockRestore();
  });
});
