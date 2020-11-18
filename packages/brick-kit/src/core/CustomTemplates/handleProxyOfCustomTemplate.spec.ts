import { handleProxyOfCustomTemplate } from "./handleProxyOfCustomTemplate";
import { RuntimeBrick } from "../BrickNode";
import { propertyMerge } from "./propertyMerge";

jest.mock("./propertyMerge");

(propertyMerge as jest.Mock).mockReturnValue(["merged"]);

describe("handleProxyOfCustomTemplate", () => {
  it("should handleProxyOfCustomTemplate for no proxy", () => {
    const getElement = (): HTMLElement => document.createElement("div");
    expect(() => {
      handleProxyOfCustomTemplate({
        element: getElement(),
      });
      handleProxyOfCustomTemplate({
        element: getElement(),
        proxy: {},
      });
      handleProxyOfCustomTemplate({
        element: getElement(),
        proxyRefs: new Map(),
      });
      handleProxyOfCustomTemplate({
        element: getElement(),
        proxy: {},
        proxyRefs: new Map(),
      });
      handleProxyOfCustomTemplate({
        element: getElement(),
        proxy: {
          properties: {
            button: {
              ref: "button",
              refProperty: "buttonName",
            },
            noGap: {
              ref: "micro-view",
              refProperty: "noGap",
            },
          },
          events: {
            "button.click": {
              ref: "button",
              refEvent: "general.button.click",
            },
          },
          methods: {
            tell: {
              ref: "button",
              refMethod: "tellStory",
            },
          },
        },
        proxyRefs: new Map(),
      });
    }).not.toThrow();
  });

  it("should handleProxyOfCustomTemplate", async () => {
    const tplElement = document.createElement("div") as any;
    const button = document.createElement("div") as any;
    const input = document.createElement("div") as any;
    const link = document.createElement("div") as any;
    const microView = document.createElement("div") as any;
    tplElement.appendChild(button);
    tplElement.appendChild(input);
    tplElement.appendChild(link);
    tplElement.appendChild(microView);

    button.buttonName = "original button name";
    button.buttonType = "default";
    button.style.display = "block";
    button.tellStory = jest.fn();
    microView.noGap = false;
    microView.columns = [1];
    const nonBubbleEvents: CustomEvent[] = [];
    tplElement.addEventListener("button.click", (event: CustomEvent) => {
      nonBubbleEvents.push(event);
    });
    const bubbleEvents: CustomEvent[] = [];
    tplElement.addEventListener("bubbles.happen", (event: CustomEvent) => {
      bubbleEvents.push(event);
    });

    const brick: RuntimeBrick = {
      element: tplElement,
      proxy: {
        properties: {
          button: {
            ref: "button",
            refProperty: "buttonName",
          },
          noGap: {
            ref: "micro-view",
            refProperty: "noGap",
          },
          isDanger: {
            ref: "button",
            refTransform: {
              buttonType: "<% DATA.isDanger ? 'danger' : 'default' %>",
              "style.display": "<% DATA.isDanger ? 'inline' : 'block' %>",
            },
          },
          sharedProp: {
            ref: "button",
            refProperty: "sharedPropOfButton",
            extraOneWayRefs: [
              {
                ref: "input",
                refProperty: "sharedPropOfInput",
              },
              {
                ref: "link",
                refTransform: {
                  sharedPropOfLink: "<% `linked:${DATA.sharedProp}` %>",
                },
              },
              {
                ref: "micro-view",
                refProperty: "sharedPropOfMicroView",
              },
            ],
          },
          appendColumns: {
            ref: "micro-view",
            mergeProperty: "columns",
            mergeType: "array",
            mergeMethod: "append",
          },
        },
        events: {
          "button.click": {
            ref: "button",
            refEvent: "general.button.click",
          },
          "bubbles.happen": {
            ref: "button",
            refEvent: "bubbles.happen",
          },
        },
        methods: {
          tell: {
            ref: "button",
            refMethod: "tellStory",
          },
        },
      },
      proxyRefs: new Map([
        [
          "button",
          {
            brick: {
              element: button,
            },
          },
        ],
        [
          "input",
          {
            brick: {
              element: input,
            },
          },
        ],
        [
          "link",
          {
            brick: {
              element: link,
            },
          },
        ],
        [
          "micro-view",
          {
            brick: {
              element: microView,
            },
          },
        ],
      ]),
    };
    handleProxyOfCustomTemplate(brick);

    // Changed prop in proxy.
    expect(tplElement.button).toBe("original button name");
    tplElement.button = "new button name";
    expect(tplElement.button).toBe("new button name");
    expect(button.buttonName).toBe("new button name");

    // Same prop name as proxy.
    expect(tplElement.noGap).toBe(false);
    tplElement.noGap = true;
    expect(tplElement.noGap).toBe(true);
    expect(microView.noGap).toBe(true);

    // Changed transformable prop in proxy.
    expect(tplElement.isDanger).toBe(undefined);
    tplElement.isDanger = true;
    expect(tplElement.isDanger).toBe(true);
    expect(button.buttonType).toBe("danger");
    expect(button.style.display).toBe("inline");

    // Shared props among bricks by `extraOneWayRefs`.
    expect(tplElement.sharedProp).toBe(undefined);
    expect(button.sharedPropOfButton).toBe(undefined);
    expect(input.sharedPropOfInput).toBe(undefined);
    expect(link.sharedPropOfLink).toBe(undefined);
    expect(microView.sharedPropOfMicroView).toBe(undefined);
    tplElement.sharedProp = "shared";
    expect(button.sharedPropOfButton).toBe("shared");
    expect(input.sharedPropOfInput).toBe("shared");
    expect(link.sharedPropOfLink).toBe("linked:shared");
    expect(microView.sharedPropOfMicroView).toBe("shared");

    expect(tplElement.appendColumns).toEqual(undefined);
    expect(microView.columns).toEqual([1]);
    tplElement.appendColumns = [2, 3];
    // Merge function is mocked and always return `["merged"]`.
    expect(microView.columns).toEqual(["merged"]);

    // Proxies in `extraOneWayRefs` can't proxy back.
    link.sharedPropOfLink = "shared-updated-by-link";
    expect(tplElement.sharedProp).toBe("shared");
    expect(button.sharedPropOfButton).toBe("shared");
    expect(input.sharedPropOfInput).toBe("shared");
    expect(microView.sharedPropOfMicroView).toBe("shared");

    // Normal proxies can still proxy back.
    button.sharedPropOfButton = "shared-updated-by-button";
    expect(tplElement.sharedProp).toBe("shared-updated-by-button");
    // But can't reverse proxy to `extraOneWayRefs` again.
    expect(input.sharedPropOfInput).toBe("shared");
    expect(link.sharedPropOfLink).toBe("shared-updated-by-link");
    expect(microView.sharedPropOfMicroView).toBe("shared");

    // Invoke a method.
    tplElement.tell("good", "story");
    expect(button.tellStory).toBeCalledWith("good", "story");

    // Dispatch an event.
    button.dispatchEvent(
      new CustomEvent("general.button.click", {
        detail: "oops!",
        cancelable: true,
      })
    );
    expect(nonBubbleEvents.length).toBe(1);
    expect(nonBubbleEvents[0].type).toBe("button.click");
    expect(nonBubbleEvents[0].detail).toBe("oops!");
    expect(nonBubbleEvents[0].cancelable).toBe(true);
    expect(nonBubbleEvents[0].bubbles).toBe(false);
    expect(nonBubbleEvents[0].composed).toBe(false);

    // Dispatch an bubble event.
    button.dispatchEvent(
      new CustomEvent("bubbles.happen", {
        detail: "bubbles!",
        bubbles: true,
      })
    );
    expect(bubbleEvents.length).toBe(1);
    expect(bubbleEvents[0].type).toBe("bubbles.happen");
    expect(bubbleEvents[0].detail).toBe("bubbles!");
    expect(bubbleEvents[0].cancelable).toBe(false);
    expect(bubbleEvents[0].bubbles).toBe(true);
    expect(bubbleEvents[0].composed).toBe(false);

    expect(tplElement.$$getElementByRef("button")).toBe(button);
    expect(tplElement.$$getElementByRef("not-existed")).toBe(undefined);
  });
});
