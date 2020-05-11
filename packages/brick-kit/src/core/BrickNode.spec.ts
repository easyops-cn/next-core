import { bindListeners } from "../bindListeners";
import { BrickNode, RuntimeBrick } from "./BrickNode";
import { handleProxyOfCustomTemplate } from "./exports";

jest.mock("../bindListeners");
jest.mock("./CustomTemplates");
const spyOnBindListeners = bindListeners as jest.Mock;

// Mock a custom element of `custom-existed`.
customElements.define("custom-existed", class Tmp extends HTMLElement {});

describe("BrickNode", () => {
  afterEach(() => {
    (handleProxyOfCustomTemplate as jest.Mock).mockClear();
  });

  it("should mount simple brick", () => {
    const runtimeBrick: RuntimeBrick = {
      type: "div",
      properties: {
        title: "good",
      },
      events: {
        click: () => {
          // Do nothing
        },
      },
    };
    const brickNode = new BrickNode(runtimeBrick);
    const node = brickNode.mount();
    expect(node.nodeName).toBe("DIV");
    expect(node.getAttribute("slot")).toBe(null);
    // expect(node.title).toBe("good");
    expect(node.childNodes.length).toBe(0);
    const callArgs = spyOnBindListeners.mock.calls[0];
    expect(callArgs[0]).toBe(node);
    expect(callArgs[1]).toBe(runtimeBrick.events);

    brickNode.afterMount();
    expect(handleProxyOfCustomTemplate).toBeCalledTimes(1);
  });

  it("should mount slotted brick", () => {
    const runtimeBrick: RuntimeBrick = {
      type: "div",
      properties: {},
      events: {},
      children: [
        {
          type: "p",
          properties: {
            title: "better",
          },
          events: {},
          children: [],
          slotId: "content",
        },
      ],
    };
    const brickNode = new BrickNode(runtimeBrick);
    const node = brickNode.mount();
    expect(node.getAttribute("slot")).toBe(null);
    expect(node.childNodes.length).toBe(1);
    expect(node.firstChild.nodeName).toBe("P");
    // expect((node.firstChild as HTMLElement).title).toBe("better");
    expect((node.firstChild as HTMLElement).getAttribute("slot")).toBe(
      "content"
    );

    brickNode.afterMount();
    expect(handleProxyOfCustomTemplate).toBeCalledTimes(2);
  });

  it("should unmount", () => {
    const runtimeBrick: RuntimeBrick = {
      type: "custom-existed",
      properties: {},
      events: {},
      children: [
        {
          type: "custom-not-existed",
          properties: {
            title: "better",
          },
          events: {},
          children: [],
          slotId: "content",
        },
      ],
    };
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => void 0);
    const brickNode = new BrickNode(runtimeBrick);
    const node = brickNode.mount();
    expect(node.childNodes.length).toBe(1);
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError.mock.calls[0][0]).toContain("custom-not-existed");
    consoleError.mockRestore();
    brickNode.unmount();
    // Currently nothing happened.
    expect(node.childNodes.length).toBe(1);
  });
});
