import { Storyboard, BrickPackage } from "@next-core/brick-types";
import {
  getDllAndDepsOfStoryboard,
  getDllAndDepsOfBricks,
  getDllAndDepsByResource,
} from "./getDllAndDepsOfStoryboard";
import { scanBricksInStoryboard } from "./scanBricksInStoryboard";
import { scanProcessorsInStoryboard } from "./scanProcessorsInStoryboard";

jest.mock("./scanBricksInStoryboard");
jest.mock("./scanProcessorsInStoryboard");

(scanBricksInStoryboard as jest.Mock).mockReturnValue([
  "a.brick-a",
  "c.brick-c",
]);

(scanProcessorsInStoryboard as jest.Mock).mockReturnValue(["d.doGood"]);

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
    dll: [],
    filePath: "bricks/d/dist/d.js",
  },
  {
    filePath: "bricks/m/dist/m.js",
  },
  {
    filePath: "bricks/a-test/dist/bbc.js",
  },
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
    const storyboard: Storyboard = {} as any;
    expect(getDllAndDepsOfStoryboard(storyboard, brickPackages)).toEqual({
      dll: ["dll-of-d3.123.js"],
      deps: ["bricks/a/dist/a.js", "bricks/c/dist/c.js", "bricks/d/dist/d.js"],
      bricks: ["a.brick-a", "c.brick-c"],
    });
  });
});

describe("getDllAndDepsOfBricks", () => {
  it("should work", () => {
    expect(
      getDllAndDepsOfBricks(
        ["a.brick-a", "c.brick-c", "m.brick-m", "invalid.brick-z"],
        brickPackages
      )
    ).toEqual({
      dll: ["dll-of-d3.123.js"],
      deps: ["bricks/a/dist/a.js", "bricks/c/dist/c.js", "bricks/m/dist/m.js"],
    });

    expect(spyConsoleError.mock.calls[0][0]).toEqual(
      "the name of brick is `invalid.brick-z` and it don't match any brick package"
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
    });
  });

  it("should show error message", () => {
    getDllAndDepsByResource(
      {
        bricks: ["invalid-bricks"],
        editorBricks: ["invalid--editor"],
        processors: ["inValidProcessor"],
      },
      [
        {
          filePath: "invalid/file/path",
        },
      ]
    );

    expect(spyConsoleError.mock.calls[0][0]).toEqual(
      "the file path of brick is `invalid/file/path` and it is non-standard package path"
    );
    expect(spyConsoleError.mock.calls[1][0]).toEqual(
      "the name of brick is `invalid-bricks` and it don't match any package"
    );

    expect(spyConsoleError.mock.calls[2][0]).toEqual(
      "the name of processor is `inValidProcessor` and it don't match any package"
    );

    expect(spyConsoleError.mock.calls[3][0]).toEqual(
      "the name of editor is `invalid--editor` and it don't match any editor package"
    );
  });

  it("should work for empty resource", () => {
    expect(getDllAndDepsByResource({}, brickPackages)).toEqual({
      dll: [],
      deps: [],
    });
  });
});
