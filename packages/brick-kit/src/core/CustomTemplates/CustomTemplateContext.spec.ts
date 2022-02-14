import { RuntimeBrick } from "../BrickNode";
import {
  CustomTemplateContext,
  getCustomTemplateContext,
} from "./CustomTemplateContext";

describe("CustomTemplateContext", () => {
  it("should work", () => {
    const brick: RuntimeBrick = {};
    const context = new CustomTemplateContext(brick);

    expect(context.id).toBe("tpl-ctx-1");

    context.setVariables({
      quality: "good",
    });

    expect(context.getVariables()).toEqual({
      quality: "good",
    });

    brick.element = {
      quality: "better",
    } as any;

    expect(context.getVariables()).toEqual({
      quality: "better",
    });

    expect(context.getBrick()).toBe(brick);

    expect(getCustomTemplateContext("tpl-ctx-1")).toBe(context);
  });
});
