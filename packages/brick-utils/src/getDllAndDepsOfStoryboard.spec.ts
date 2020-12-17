import { Storyboard, BrickPackage } from "@easyops/brick-types";
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

(window as any).DLL_HASH = {
  d3: "fake-hash",
  "editor-bricks-helper": "fake-hash-of-editors",
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
];

describe("getDllAndDepsOfStoryboard", () => {
  it("should work", () => {
    const storyboard: Storyboard = {} as any;
    expect(getDllAndDepsOfStoryboard(storyboard, brickPackages)).toEqual({
      dll: ["dll-of-d3.js?fake-hash"],
      deps: ["x", "z", "w"],
    });
  });
});

describe("getDllAndDepsOfBricks", () => {
  it("should work for empty bricks", () => {
    expect(getDllAndDepsOfBricks([], [])).toEqual({
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
      dll: ["dll-of-editor-bricks-helper.js?fake-hash-of-editors"],
      deps: ["z/editors"],
    });
  });
});
