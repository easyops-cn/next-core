import { CustomTemplate } from "@easyops/brick-types";
import { collectRefsInTemplate } from "./collectRefsInTemplate";

describe("collectRefsInTemplate", () => {
  it("should work", () => {
    const template: CustomTemplate = {
      name: "tpl-test",
      proxy: {},
      bricks: [
        {
          brick: "b-a",
          ref: "r-a",
          slots: {
            toolbar: {
              type: "bricks",
              bricks: null,
            },
            content: {
              type: "bricks",
              bricks: [
                {
                  brick: "b-b",
                  ref: "r-b",
                },
                {
                  brick: "b-c",
                },
              ],
            },
          },
        },
      ],
    };
    const refMap = collectRefsInTemplate(template);
    expect(refMap.size).toBe(2);
    expect(refMap.get("r-a").brick).toBe("b-a");
    expect(refMap.get("r-b").brick).toBe("b-b");
  });
});
