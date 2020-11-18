import { RuntimeBrick } from "../BrickNode";
import { CustomTemplateContext } from "./CustomTemplateContext";

describe("CustomTemplateContext", () => {
  let context: CustomTemplateContext;

  beforeEach(() => {
    context = new CustomTemplateContext();
  });

  it("should work", () => {
    const id = context.createContext();
    const brick = {} as RuntimeBrick;

    context.sealContext(
      id,
      {
        quality: "good",
      },
      brick
    );

    expect(context.getContext(id)).toEqual({
      quality: "good",
    });

    brick.element = {
      quality: "better",
    } as any;

    expect(context.getContext(id)).toEqual({
      quality: "better",
    });
  });
});
