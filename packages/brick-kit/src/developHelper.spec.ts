import { asyncProcessBrick } from "@easyops/brick-utils";
import { BrickConf } from "@easyops/brick-types";
import { developHelper } from "./developHelper";
import { _dev_only_getTemplatePackages } from "./core/Runtime";

jest.mock("@easyops/brick-utils");
jest.mock("./core/Runtime");

(asyncProcessBrick as jest.Mock).mockImplementation((brickConf: BrickConf) => {
  brickConf.brick = brickConf.template;
  delete brickConf.template;
});

(_dev_only_getTemplatePackages as jest.Mock).mockReturnValue([]);

describe("developHelper", () => {
  it("should asyncProcessBrick", () => {
    const brickConf: BrickConf = {
      template: "hello",
    };
    developHelper.asyncProcessBrick(brickConf);
    expect(brickConf).toEqual({
      brick: "hello",
    });
  });
});
