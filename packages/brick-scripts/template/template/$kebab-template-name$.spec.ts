import { BrickConf } from "@next-core/brick-types";
import {
  $camelTemplateName$Factory,
  $PascalTemplateName$Params,
} from "./$kebab-template-name$";

jest.mock("@next-core/brick-kit", () => ({
  getRuntime: () => ({
    registerBrickTemplate: jest.fn(),
  }),
}));

describe("micro-app", () => {
  it.each<[$PascalTemplateName$Params, BrickConf]>([
    [
      {},
      {
        brick: "your.brick",
      },
    ],
  ])("$camelTemplateName$Factory(%j) should work", (params, brickConf) => {
    expect($camelTemplateName$Factory(params)).toEqual(brickConf);
  });
});
