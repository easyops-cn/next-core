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

(scanBricksInStoryboard as jest.Mock).mockReturnValue(["a", "c"]);

(scanProcessorsInStoryboard as jest.Mock).mockReturnValue(["doGood"]);

window.DLL_PATH = {
  d3: "dll-of-d3.123.js",
  "editor-bricks-helper": "dll-of-editor-bricks-helper.456.js",
};

const brickPackages: BrickPackage[] = [
  {
    bricks: ["a"],
    dll: ["d3"],
    filePath: "x",
  },
  {
    bricks: ["b"],
    filePath: "y",
  },
  {
    bricks: ["c"],
    dll: ["d3"],
    filePath: "z",
    editors: ["c--editor"],
    editorsJsFilePath: "z/editors",
  },
  {
    bricks: [],
    dll: [],
    processors: ["doGood"],
    filePath: "w",
  },
  {
    bricks: ["m"],
    filePath: "n",
  },
];

describe("getDllAndDepsOfStoryboard", () => {
  it("should work", () => {
    const storyboard: Storyboard = {} as any;
    expect(getDllAndDepsOfStoryboard(storyboard, brickPackages)).toEqual({
      dll: ["dll-of-d3.123.js"],
      deps: ["x", "z", "w"],
      bricks: ["a", "c"],
    });
  });
});

describe("getDllAndDepsOfBricks", () => {
  it("should work", () => {
    expect(getDllAndDepsOfBricks(["a", "c", "m"], brickPackages)).toEqual({
      dll: ["dll-of-d3.123.js"],
      deps: ["x", "z", "n"],
    });
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
          editorBricks: ["b--editor", "c--editor"],
        },
        brickPackages
      )
    ).toEqual({
      dll: ["dll-of-editor-bricks-helper.456.js"],
      deps: ["z/editors"],
    });
  });

  it("should work for bricks and editor bricks", () => {
    expect(
      getDllAndDepsByResource(
        {
          bricks: ["m"],
          editorBricks: ["b--editor", "c--editor"],
        },
        brickPackages
      )
    ).toEqual({
      dll: ["dll-of-editor-bricks-helper.456.js"],
      deps: ["z/editors", "n"],
    });
  });

  it("should work for empty resource", () => {
    expect(getDllAndDepsByResource({}, brickPackages)).toEqual({
      dll: [],
      deps: [],
    });
  });
});
