import type { BrickConf } from "@next-core/brick-types";
import { identity } from "lodash";
import { replaceSlotWithSlottedBricks } from "./replaceSlotWithSlottedBricks";
import type { ProxyContext } from "./expandCustomTemplate";

describe("replaceSlotWithSlottedBricks", () => {
  let mockHostContext: ProxyContext;

  beforeEach(() => {
    mockHostContext = {
      proxyBrick: {
        type: "tpl-test",
      },
      usedSlots: new Set(),
    } as unknown as ProxyContext;
  });

  it("should throw an error if 'if' is used in a slot", () => {
    const brickConf = { brick: "slot", if: false };
    expect(() =>
      replaceSlotWithSlottedBricks(brickConf, mockHostContext, identity)
    ).toThrow(
      `Can not use "if" in a slot currently, check your template "tpl-test"`
    );
    const brickConf2 = { brick: "slot", if: "<% true %>" };
    expect(() =>
      replaceSlotWithSlottedBricks(brickConf2, mockHostContext, identity)
    ).toThrow(
      `Can not use "if" in a slot currently, check your template "tpl-test"`
    );
  });

  it("should throw an error if slot name is an expression", () => {
    const brickConf = {
      brick: "slot",
      properties: { name: "<% 'abc' %>" },
    } as BrickConf;
    expect(() =>
      replaceSlotWithSlottedBricks(brickConf, mockHostContext, identity)
    ).toThrow(
      `Can not use an expression as slot name "<% 'abc' %>" currently, check your template "tpl-test"`
    );
  });

  it("should throw an error if slot name is repeated", () => {
    const brickConf = {
      brick: "div",
      properties: { name: "repeated-slot" },
    } as BrickConf;
    mockHostContext.usedSlots.add("repeated-slot");
    expect(() =>
      replaceSlotWithSlottedBricks(brickConf, mockHostContext, identity)
    ).toThrow(
      `Can not have multiple slots with the same name "repeated-slot", check your template "tpl-test"`
    );
  });

  it("should return external bricks if available", () => {
    const brickConf = {
      brick: "slot",
      properties: { name: "slot1" },
    } as BrickConf;
    mockHostContext.externalSlots = {
      slot1: { type: "bricks", bricks: [{ brick: "h1" }, { brick: "h2" }] },
    };
    const result = replaceSlotWithSlottedBricks(
      brickConf,
      mockHostContext,
      identity
    );
    expect(result).toEqual([{ brick: "h1" }, { brick: "h2" }]);
  });

  it("should return expanded default slots if no external bricks", () => {
    const brickConf = {
      brick: "slot",
      properties: { name: "slot1" },
      slots: {
        "": {
          type: "bricks",
          bricks: [
            {
              brick: "p",
            },
          ],
        },
        oops: {
          type: "bricks",
          bricks: [
            {
              brick: "hr",
            },
          ],
        },
      },
    } as BrickConf;
    const expandMock = jest.fn().mockImplementation((item) => [item]);
    const result = replaceSlotWithSlottedBricks(
      brickConf,
      mockHostContext,
      expandMock
    );
    expect(result).toEqual([{ brick: "p" }]);
    expect(expandMock).toHaveBeenCalledTimes(1);
  });

  it("no default bricks nor external bricks", () => {
    const brickConf = {
      brick: "slot",
      properties: { name: "slot1" },
    } as BrickConf;
    const result = replaceSlotWithSlottedBricks(
      brickConf,
      mockHostContext,
      identity
    );
    expect(result).toEqual([]);
  });
});
