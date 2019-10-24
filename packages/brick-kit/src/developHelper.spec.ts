import { asyncProcessBrick } from "@easyops/brick-utils";
import { BrickConf } from "@easyops/brick-types";
import { developHelper } from "./developHelper";

jest.mock("@easyops/brick-utils");

(asyncProcessBrick as jest.Mock).mockImplementation((brickConf: BrickConf) => {
  brickConf.brick = brickConf.template;
  delete brickConf.template;
});

describe("developHelper", () => {
  it("should asyncProcessBrick", () => {
    const brickConf: BrickConf = {
      template: "hello"
    };
    developHelper.asyncProcessBrick(brickConf);
    expect(brickConf).toEqual({
      brick: "hello"
    });
  });
});
