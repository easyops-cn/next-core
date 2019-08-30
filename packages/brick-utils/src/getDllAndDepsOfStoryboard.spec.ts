import { getDllAndDepsOfStoryboard } from "./getDllAndDepsOfStoryboard";
import { scanBricksInStoryboard } from "./scanBricksInStoryboard";
import { Storyboard, BrickPackage } from "@easyops/brick-types";

jest.mock("./scanBricksInStoryboard");
const spyOnScanBricksInStoryboard = scanBricksInStoryboard as jest.Mock;
spyOnScanBricksInStoryboard.mockReturnValue(["a", "c"]);

(window as any).DLL_HASH = {
  d3: "fake-hash"
};

describe("getDllAndDepsOfStoryboard", () => {
  it("should work", () => {
    const storyboard: Storyboard = {} as any;
    const brickPackages: BrickPackage[] = [
      {
        bricks: ["a"],
        dll: ["d3"],
        filePath: "x"
      },
      {
        bricks: ["b"],
        filePath: "y"
      },
      {
        bricks: ["c"],
        filePath: "z"
      }
    ];
    expect(getDllAndDepsOfStoryboard(storyboard, brickPackages)).toEqual({
      dll: ["dll-of-d3.js?fake-hash"],
      deps: ["x", "z"]
    });
  });
});
