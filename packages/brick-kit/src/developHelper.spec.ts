import { processBrick } from "@easyops/brick-utils";
import { BrickConf } from "@easyops/brick-types";
import { developHelper } from "./developHelper";

jest.mock("@easyops/brick-utils");

(processBrick as jest.Mock).mockImplementation((brickConf: BrickConf) => {
  brickConf.brick = brickConf.template;
  delete brickConf.template;
});

describe("developHelper", () => {
  it("should processBrick", () => {
    const brickConf: BrickConf = {
      template: "hello"
    };
    developHelper.processBrick(brickConf);
    expect(brickConf).toEqual({
      brick: "hello"
    });
  });
});
