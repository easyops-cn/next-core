import { BrickConf } from "@easyops/brick-types";
import {
  $camelTemplateNameFactory,
  $PascalTemplateParams
} from "./$kebab-template-name$";

jest.mock("@easyops/brick-kit", () => ({
  getRuntime: () => ({
    registerBrickTemplate: jest.fn()
  })
}));

describe("micro-app", () => {
  it.each<[$PascalTemplateParams, BrickConf]>([
    [
      {},
      {
        brick: "your.brick"
      }
    ]
  ])("$camelTemplateNameFactory(%j) should work", (params, brickConf) => {
    expect($camelTemplateNameFactory(params)).toEqual(brickConf);
  });
});
