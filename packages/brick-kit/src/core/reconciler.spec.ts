import {
  mountTree,
  mountStaticNode,
  MountableElement,
  afterMountTree,
} from "./reconciler";
import { RuntimeBrick } from "./BrickNode";
import { setRealProperties } from "../setProperties";

jest.mock("./BrickNode");
jest.mock("@easyops/brick-utils");
jest.mock("../setProperties");

describe("reconciler", () => {
  it("should mount tree", () => {
    const mountPoint: MountableElement = document.createElement("div") as any;
    const runtimeBricks: RuntimeBrick[] = [
      {
        type: "div",
        properties: {},
        events: {},
      },
    ];
    mountTree(runtimeBricks, mountPoint);
    expect(mountPoint.children.length).toBe(1);
    expect(mountPoint.children[0].tagName).toBe("DIV");
  });

  it("should re-mount tree", () => {
    const mountPoint: MountableElement = document.createElement("div") as any;
    const runtimeBricks: RuntimeBrick[] = [
      {
        type: "div",
        properties: {},
        events: {},
      },
    ];
    mountTree(runtimeBricks, mountPoint);
    expect(mountPoint.children[0].tagName).toBe("DIV");
    const newBricks: RuntimeBrick[] = [
      {
        type: "p",
        properties: {},
        events: {},
      },
    ];
    mountTree(newBricks, mountPoint);
    expect(mountPoint.children[0].tagName).toBe("P");
  });

  it("should mount static node", () => {
    const mountPoint = document.createElement("div");
    const properties = {
      title: "good",
    };
    mountStaticNode(mountPoint, properties);
    expect(setRealProperties as jest.Mock).toBeCalledWith(
      mountPoint,
      properties
    );
  });

  it("should work after mount tree", () => {
    const mountPoint: MountableElement = document.createElement("div") as any;
    expect(() => {
      afterMountTree(mountPoint);
    }).not.toThrow();
    const afterMount = jest.fn();
    mountPoint.$$rootBricks = [
      {
        afterMount,
      } as any,
    ];
    afterMountTree(mountPoint);
    expect(afterMount).toBeCalled();
  });
});
