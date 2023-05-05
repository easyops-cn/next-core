import { Storyboard, BrickPackage } from "@next-core/brick-types";
import {
  getDllAndDepsOfStoryboard,
  getDllAndDepsOfBricks,
  getDllAndDepsByResource,
} from "./getDllAndDepsOfStoryboard";

window.DLL_PATH = {
  d3: "dll-of-d3.123.js",
  "editor-bricks-helper": "dll-of-editor-bricks-helper.456.js",
};

const brickPackages: BrickPackage[] = [
  {
    dll: ["d3"],
    filePath: "bricks/a/dist/a.js",
  },
  {
    filePath: "bricks/b/dist/b.js",
  },
  {
    dll: ["d3"],
    filePath: "bricks/c/dist/c.js",
    editorsJsFilePath: "bricks/c/dist/editors/editors.js",
  },
  {
    dll: ["d3"],
    filePath: "bricks/d/dist/d.js",
  },
  {
    dll: [],
    filePath: "bricks/d/dist/d.js",
  },
  {
    filePath: "bricks/m/dist/m.js",
  },
  {
    filePath: "bricks/a-test/dist/bbc.js",
  },
  {
    filePath: "bricks/test-widgets/dist/index.js",
  },
  {
    id: "bricks/v3",
    filePath: "bricks/v3/dist/index.js",
  } as BrickPackage,
];

let spyConsoleError: jest.SpyInstance;

beforeAll(() => {
  spyConsoleError = jest.spyOn(console, "error").mockReturnValue(undefined);
});

afterAll(() => {
  spyConsoleError.mockRestore();
});

afterEach(() => {
  spyConsoleError.mockClear();
});

describe("getDllAndDepsOfStoryboard", () => {
  it("should work", () => {
    const storyboard: Storyboard = {
      routes: [
        {
          bricks: [
            {
              brick: "a.brick-a",
            },
            {
              brick: "c.brick-c",
              properties: {
                any: "<% PROCESSORS.d.doGood() %>",
              },
            },
            {
              brick: "test-widgets.tpl-xyz",
            },
          ],
        },
      ],
    } as any;
    expect(getDllAndDepsOfStoryboard(storyboard, brickPackages)).toEqual({
      dll: ["dll-of-d3.123.js"],
      deps: [
        "bricks/a/dist/a.js",
        "bricks/c/dist/c.js",
        "bricks/test-widgets/dist/index.js",
        "bricks/d/dist/d.js",
      ],
      bricks: ["a.brick-a", "c.brick-c", "test-widgets.tpl-xyz"],
      v3Bricks: [],
      v3Processors: [],
      eager: {
        dll: [],
        deps: ["bricks/test-widgets/dist/index.js", "bricks/d/dist/d.js"],
        v3Bricks: [],
        v3Processors: [],
      },
    });
  });

  it("should ignore bricks and processors in unused templates", () => {
    const storyboard: Storyboard = {
      routes: [
        {
          type: "bricks",
          bricks: [
            {
              brick: "tpl-abc",
              properties: {
                any: "<% PROCESSORS.a.doGood() %>",
              },
            },
          ],
        },
      ],
      meta: {
        customTemplates: [
          {
            name: "tpl-abc",
            bricks: [
              {
                brick: "tpl-inner-used",
              },
              {
                brick: "div",
                properties: {
                  any: "<% PROCESSORS.b.doGood() %>",
                },
              },
            ],
          },
          {
            name: "tpl-inner-used",
            bricks: [
              {
                brick: "any-brick",
                properties: {
                  any: "<% PROCESSORS.c.doGood() %>",
                },
              },
            ],
          },
          {
            name: "tpl-unused",
            bricks: [
              {
                brick: "any",
                properties: {
                  any: "<% PROCESSORS.d.doGood() %>",
                },
              },
            ],
          },
        ],
      },
    } as any;
    expect(
      getDllAndDepsOfStoryboard(storyboard, brickPackages, {
        ignoreBricksInUnusedCustomTemplates: true,
      })
    ).toEqual({
      dll: ["dll-of-d3.123.js"],
      deps: ["bricks/a/dist/a.js", "bricks/b/dist/b.js", "bricks/c/dist/c.js"],
      bricks: ["any-brick"],
      v3Bricks: [],
      v3Processors: [],
      eager: {
        dll: ["dll-of-d3.123.js"],
        deps: [
          "bricks/a/dist/a.js",
          "bricks/b/dist/b.js",
          "bricks/c/dist/c.js",
        ],
        v3Bricks: [],
        v3Processors: [],
      },
    });
  });
});

describe("getDllAndDepsOfBricks", () => {
  it("should work", () => {
    expect(
      getDllAndDepsOfBricks(
        [
          "a.brick-a",
          "c.brick-c",
          "m.brick-m",
          "invalid.brick-z",
          "tpl-create-form",
        ],
        brickPackages
      )
    ).toEqual({
      dll: ["dll-of-d3.123.js"],
      deps: ["bricks/a/dist/a.js", "bricks/c/dist/c.js", "bricks/m/dist/m.js"],
    });

    expect(spyConsoleError.mock.calls[0][0]).toEqual(
      "Brick `invalid.brick-z` does not match any brick package"
    );
  });

  it("should work for empty bricks", () => {
    expect(getDllAndDepsOfBricks([], brickPackages)).toEqual({
      dll: [],
      deps: [],
    });
  });
});

describe("getDllAndDepsByResource", () => {
  it("should work for editor bricks", () => {
    expect(
      getDllAndDepsByResource(
        {
          editorBricks: ["c.editor-c--editor"],
        },
        brickPackages
      )
    ).toEqual({
      dll: ["dll-of-editor-bricks-helper.456.js"],
      deps: ["bricks/c/dist/editors/editors.js"],
      v3Bricks: [],
      v3Processors: [],
    });
  });

  it("should work for bricks, processor and editor bricks", () => {
    expect(
      getDllAndDepsByResource(
        {
          bricks: ["m.brick-m"],
          editorBricks: ["c.editor-c--editor"],
          processors: ["aTest.custom-Processor"],
        },
        brickPackages
      )
    ).toEqual({
      dll: ["dll-of-editor-bricks-helper.456.js"],
      deps: [
        "bricks/m/dist/m.js",
        "bricks/a-test/dist/bbc.js",
        "bricks/c/dist/editors/editors.js",
      ],
      v3Bricks: [],
      v3Processors: [],
    });
  });

  it("should ignore package with no editors", () => {
    expect(
      getDllAndDepsByResource(
        {
          editorBricks: ["d.editor-d--editor"],
        },
        brickPackages
      )
    ).toEqual({
      dll: [],
      deps: [],
      v3Bricks: [],
      v3Processors: [],
    });
  });

  it("should show error message", () => {
    getDllAndDepsByResource(
      {
        bricks: ["invalid.form-bricks", "tpl-create-form"],
        editorBricks: ["invalid.form--editor"],
        processors: ["inValidProcessor.covert"],
      },
      [
        {
          filePath: "invalid/file/path",
          editorsJsFilePath: "another/invalid/file/path",
        },
      ]
    );

    expect(spyConsoleError.mock.calls[0][0]).toEqual(
      'Unexpected brick package file path: "invalid/file/path"'
    );
    expect(spyConsoleError.mock.calls[1][0]).toEqual(
      "Brick `invalid.form-bricks` does not match any brick package"
    );

    expect(spyConsoleError.mock.calls[2][0]).toEqual(
      "Processor `inValidProcessor.covert` does not match any brick package"
    );

    expect(spyConsoleError.mock.calls[3][0]).toEqual(
      "Editor `invalid.form--editor` does not match any brick package"
    );
  });

  it("should work for empty resource", () => {
    expect(getDllAndDepsByResource({}, brickPackages)).toEqual({
      dll: [],
      deps: [],
      v3Bricks: [],
      v3Processors: [],
    });

    expect(
      getDllAndDepsByResource({ bricks: ["a.brick-a"] }, [] as BrickPackage[])
    ).toEqual({
      deps: [],
      dll: [],
      v3Bricks: [],
      v3Processors: [],
    });
  });

  it("should work for v3 bricks", () => {
    expect(
      getDllAndDepsByResource(
        {
          bricks: ["v3.my-button"],
        },
        brickPackages
      )
    ).toEqual({
      dll: [],
      deps: ["bricks/v3/dist/index.js"],
      v3Bricks: ["v3.my-button"],
      v3Processors: [],
    });
  });

  it("should work for v3 processors", () => {
    expect(
      getDllAndDepsByResource(
        {
          processors: ["v3.myTest"],
        },
        brickPackages
      )
    ).toEqual({
      dll: [],
      deps: ["bricks/v3/dist/index.js"],
      v3Bricks: [],
      v3Processors: ["v3.myTest"],
    });
  });
});
