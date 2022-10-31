import { StoryDoc } from "@next-core/brick-types";
import { getEditorBrick } from "./getEditorBrick";

jest.mock("@next-core/brick-kit", () => ({
  developHelper: {
    loadEditorBricks(bricks: string[]) {
      if (bricks.includes("will-fail--editor")) {
        return Promise.reject("oops");
      }
      return Promise.resolve();
    },
  },
}));

// Mock some editor bricks.
customElements.define("micro-view--editor", class Tmp extends HTMLElement {});
customElements.define(
  "basic-bricks.any-brick--editor",
  class Tmp extends HTMLElement {}
);
customElements.define(
  "common-container--editor",
  class Tmp extends HTMLElement {}
);
customElements.define(
  "basic-bricks.any-route--editor",
  class Tmp extends HTMLElement {}
);

customElements.define(
  "editors-of-base-layout.tpl-page-module--editor",
  class Tmp extends HTMLElement {}
);

describe("getEditorBrick", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should get specified editor brick if it is defined", async () => {
    expect(
      await getEditorBrick({
        type: "brick",
        brick: "micro-view",
        id: "B-001",
      })
    ).toBe("micro-view--editor");
  });

  it("should get fallback editor brick if it is not defined", async () => {
    expect(
      await getEditorBrick({
        type: "brick",
        brick: "not-defined",
        id: "B-001",
      })
    ).toBe("basic-bricks.any-brick--editor");
  });

  it("should get fallback editor brick if it is not a custom element", async () => {
    expect(
      await getEditorBrick({
        type: "brick",
        brick: "div",
        id: "B-001",
      })
    ).toBe("basic-bricks.any-brick--editor");
  });

  it("should get route editor if it is a route node", async () => {
    expect(
      await getEditorBrick({
        type: "bricks",
        path: "/",
        id: "B-001",
      })
    ).toBe("basic-bricks.any-route--editor");
  });

  it("should throw error if load editor brick failed", () => {
    return expect(
      getEditorBrick({
        type: "brick",
        brick: "will-fail",
        id: "B-001",
      })
    ).rejects.toEqual(
      new Error('Load editor brick "will-fail--editor" failed')
    );
  });

  it("should throw error if it is a custom template node", () => {
    return expect(
      getEditorBrick({
        type: "custom-template",
        templateId: "tpl-test",
        id: "B-001",
      })
    ).rejects.toEqual(new Error("Unsupported node type: custom-template"));
  });

  it("should get specified editor brick from doc", async () => {
    expect(
      await getEditorBrick(
        {
          type: "brick",
          brick: "list-container",
          id: "B-001",
        },
        "common-container--editor"
      )
    ).toBe("common-container--editor");
  });
});
