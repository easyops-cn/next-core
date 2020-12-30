import { developHelper } from "@easyops/brick-kit";
import { getEditorBrick } from "./getEditorBrick";

jest.mock("@easyops/brick-kit");

const mockConsolError = jest
  .spyOn(console, "error")
  .mockImplementation(() => void 0);

(developHelper.loadEditorBricks as jest.MockedFunction<
  typeof developHelper.loadEditorBricks
>).mockImplementation((bricks) => {
  if (bricks.includes("will-fail--editor")) {
    return Promise.reject("oops");
  }
  return Promise.resolve();
});

// Mock some editor bricks.
customElements.define("micro-view--editor", class Tmp extends HTMLElement {});
customElements.define(
  "basic-bricks.any-brick--editor",
  class Tmp extends HTMLElement {}
);

describe("getEditorBrick", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should get specified editor brick if it is defined", async () => {
    expect(await getEditorBrick("micro-view")).toBe("micro-view--editor");
  });

  it("should get fallback editor brick if it is not defined", async () => {
    expect(await getEditorBrick("not-defined")).toBe(
      "basic-bricks.any-brick--editor"
    );
  });

  it("should get fallback editor brick if it is not a custom element", async () => {
    expect(await getEditorBrick("div")).toBe("basic-bricks.any-brick--editor");
  });

  it("should return undefined if load editor brick failed", async () => {
    expect(await getEditorBrick("will-fail")).toBe(undefined);
    expect(mockConsolError).toBeCalledWith(
      'Load editor brick for "will-fail" failed:',
      "oops"
    );
  });
});
