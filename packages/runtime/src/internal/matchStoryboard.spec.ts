import { matchStoryboard } from "./matchStoryboard.js";

describe("matchStoryboard", () => {
  test("handle homepage /", () => {
    const storyboards = [
      { app: { homepage: "/x" } },
      { app: { homepage: "/" } },
    ] as any;
    const result = matchStoryboard(storyboards, "/");
    expect(result).toBe(storyboards[1]);
  });

  test("handle homepage unset", () => {
    const result = matchStoryboard([{ app: {} }] as any, "/");
    expect(result).toBe(undefined);
  });
});
