import { BrickConf } from "@easyops/brick-types";
import {
  $camelTemplateName$Factory,
  $PascalTemplateName$Params
} from "./$kebab-template-name$";

jest.mock("@easyops/brick-kit", () => ({
  getRuntime: () => ({
    registerBrickTemplate: jest.fn()
  })
}));

describe("micro-app", () => {
  it.each<[$PascalTemplateName$Params, BrickConf]>([
    [
      {},
      {
        brick: "your.brick"
      }
    ]
  ])("$camelTemplateName$Factory(%j) should work", (params, brickConf) => {
    expect($camelTemplateName$Factory(params)).toEqual(brickConf);
  });
});
