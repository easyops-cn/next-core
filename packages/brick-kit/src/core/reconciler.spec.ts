import { mountTree, mountStaticNode, MountableElement } from "./reconciler";
import { RuntimeBrick } from "./BrickNode";
import { setRealProperties } from "@easyops/brick-utils";

jest.mock("./BrickNode");
jest.mock("@easyops/brick-utils");

describe("reconciler", () => {
  it("should mount tree", () => {
    const mountPoint: MountableElement = document.createElement("div") as any;
    const runtimeBricks: RuntimeBrick[] = [
      {
        type: "div",
        properties: {},
        events: {}
      }
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
        events: {}
      }
    ];
    mountTree(runtimeBricks, mountPoint);
    expect(mountPoint.children[0].tagName).toBe("DIV");
    const newBricks: RuntimeBrick[] = [
      {
        type: "p",
        properties: {},
        events: {}
      }
    ];
    mountTree(newBricks, mountPoint);
    expect(mountPoint.children[0].tagName).toBe("P");
  });

  it("should mount static node", () => {
    const mountPoint = document.createElement("div");
    const properties = {
      title: "good"
    };
    mountStaticNode(mountPoint, properties);
    expect(setRealProperties as jest.Mock).toBeCalledWith(
      mountPoint,
      properties
    );
  });
});
