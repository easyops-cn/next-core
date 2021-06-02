import { Story } from "@next-core/brick-types";
import { getBrickDoc } from "./getBrickDoc";
import { BuilderRuntimeNode } from "../interfaces";

describe("getBrickDoc", () => {
  it("should return brick story", () => {
    const node = {
      type: "brick",
      brick: "basic-bricks.general-button",
      id: "01",
      templateId: "",
    } as BuilderRuntimeNode;

    const storyList = [
      {
        type: "brick",
        storyId: "basic-bricks.general-button",
        doc: {
          editor: "base-button--editor",
          slots: [],
          memo: "this is button",
        },
      },
    ] as Story[];

    const result = getBrickDoc(node, storyList);
    expect(result).toEqual({
      editor: "base-button--editor",
      slots: [],
      memo: "this is button",
    });

    const result2 = getBrickDoc(node, undefined);
    expect(result2).toEqual(undefined);
  });
});
