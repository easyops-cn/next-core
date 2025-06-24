import { jest, describe, test, expect } from "@jest/globals";
import { customTemplates } from "./CustomTemplates.js";
import type {
  RuntimeBrick,
  RuntimeBrickElement,
  RuntimeContext,
} from "./internal/interfaces.js";
import { DataStore } from "./internal/data/DataStore.js";

const consoleWarn = jest.spyOn(console, "warn");
const consoleError = jest.spyOn(console, "error");

class TplExistedElement extends HTMLElement {}
customElements.define("tpl-existed", TplExistedElement);

describe("customTemplates", () => {
  test("define a simple tpl and re-register it", () => {
    consoleWarn.mockReturnValueOnce();

    customTemplates.define("tpl-very-simple", {
      bricks: [{ brick: "div" }],
    });
    expect(customTemplates.get("tpl-very-simple")).toEqual({
      name: "tpl-very-simple",
      proxy: {
        properties: {},
      },
      bricks: [{ brick: "div" }],
      state: [],
    });
    expect(consoleWarn).not.toHaveBeenCalled();

    const tpl = document.createElement(
      "tpl-very-simple"
    ) as RuntimeBrickElement;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(tpl.$$getElementByRef!("a")).toBe(undefined);
    expect(tpl.$$typeof).toBe("custom-template");
    expect((tpl.constructor as any)._dev_only_definedProperties).toEqual([]);
    expect((tpl.constructor as any)._dev_only_definedMethods).toEqual([]);

    // Re-register with new bricks
    customTemplates.define("tpl-very-simple", {
      bricks: [{ brick: "span" }],
    });
    expect(customTemplates.get("tpl-very-simple")).toEqual({
      name: "tpl-very-simple",
      proxy: {
        properties: {},
      },
      bricks: [{ brick: "span" }],
      state: [],
    });
    expect(consoleWarn).toHaveBeenCalledTimes(1);
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Custom template of "tpl-very-simple" already registered'
      )
    );
  });

  test("proxy", async () => {
    customTemplates.define("tpl-proxy", {
      bricks: [{ brick: "div" }],
      proxy: {
        properties: {
          propA: {
            ref: "ref-a",
          },
          propB: {
            ref: "ref-b",
            refProperty: "propC",
          },
        },
        methods: {
          methodM: {
            ref: "ref-a",
          },
          methodN: {
            ref: "ref-b",
            refMethod: "methodL",
          },
        },
      },
      state: [
        { name: "stateX" },
        { name: "stateY", value: "y" },
        { name: "stateZ", value: "z", expose: false },
      ],
    });

    const tplStateStoreId = "tpl-state-1";
    const tplStateStoreMap = new Map<string, DataStore<"STATE">>();
    const hostRuntimeContext = { tplStateStoreMap } as RuntimeContext;
    const runtimeContext = {
      tplStateStoreId,
      tplStateStoreMap,
    } as RuntimeContext;
    const refA: RuntimeBrick = {
      type: "div",
      element: document.createElement("div"),
      runtimeContext,
    };
    (refA.element as any).propA = "a2";
    const methodM = ((refA.element as any).methodM = jest.fn(() => "M"));
    const refB: RuntimeBrick = {
      type: "div",
      element: document.createElement("div"),
      runtimeContext,
    };
    (refB.element as any).propC = "b2";
    const methodL = ((refB.element as any).methodL = jest.fn(() => "L"));
    const hostBrick: RuntimeBrick = {
      type: "tpl-proxy",
      tplHostMetadata: {
        tplStateStoreId,
        internalBricksByRef: new Map([
          ["ref-a", refA],
          ["ref-b", refB],
        ]),
      },
      runtimeContext: hostRuntimeContext,
    };
    const stateStore = new DataStore("STATE", hostBrick);
    tplStateStoreMap.set(tplStateStoreId, stateStore);
    stateStore.define(
      customTemplates.get("tpl-proxy")!.state,
      hostRuntimeContext,
      [
        ["stateX", Promise.resolve("x2")],
        ["stateY", Promise.resolve("y2")],
        ["stateZ", Promise.resolve("z2")],
      ]
    );
    await stateStore.waitForAll();

    const tpl = document.createElement("tpl-proxy") as any;
    expect((tpl.constructor as any)._dev_only_definedProperties).toEqual([
      "stateX",
      "stateY",
      "propA",
      "propB",
    ]);
    expect((tpl.constructor as any)._dev_only_definedMethods).toEqual([
      "methodM",
      "methodN",
    ]);

    hostBrick.element = tpl;
    tpl.stateX = "x2";
    tpl.stateY = "y2";
    tpl.stateZ = "z2";
    tpl.propA = "a2";
    tpl.propB = "b2";

    expect(tpl.shadowRoot).toBeFalsy();
    tpl.$$tplStateStore = stateStore;
    document.body.appendChild(tpl);
    expect(tpl.shadowRoot?.textContent).toBeTruthy();

    expect(tpl.$$getElementByRef("ref-a")).toBe(refA.element);
    expect(tpl.$$getElementByRef("ref-b")).toBe(refB.element);

    // Check initial props
    expect(tpl.stateX).toBe("x2");
    expect(tpl.stateY).toBe("y2");
    expect(tpl.stateZ).toBe("z2");
    expect(stateStore.getValue("stateX")).toBe("x2");
    expect(stateStore.getValue("stateY")).toBe("y2");
    // `stateZ` is not exposed.
    expect(stateStore.getValue("stateZ")).toBe("z");
    expect(tpl.propA).toBe("a2");
    expect(tpl.propB).toBe("b2");

    const resultM = (tpl as any).methodM("p");
    expect(resultM).toBe("M");
    expect(methodM).toHaveBeenCalledTimes(1);
    expect(methodM).toHaveBeenNthCalledWith(1, "p");
    const resultN = (tpl as any).methodN("q");
    expect(resultN).toBe("L");
    expect(methodL).toHaveBeenCalledTimes(1);
    expect(methodL).toHaveBeenNthCalledWith(1, "q");

    // Update props
    tpl.stateX = "x3";
    tpl.stateY = "y3";
    tpl.stateZ = "z3";
    expect(tpl.stateX).toBe("x3");
    expect(tpl.stateY).toBe("y3");
    expect(tpl.stateZ).toBe("z3");
    expect(stateStore.getValue("stateX")).toBe("x3");
    expect(stateStore.getValue("stateY")).toBe("y3");
    // `stateZ` is not exposed.
    expect(stateStore.getValue("stateZ")).toBe("z");

    tpl.propA = "a3";
    tpl.propB = "b3";
    expect(tpl.propA).toBe("a3");
    expect(tpl.propB).toBe("b3");
    expect((refA.element as any).propA).toBe("a3");
    expect((refB.element as any).propC).toBe("b3");

    const shadowRoot = tpl.shadowRoot;
    tpl.remove();
    expect(tpl.shadowRoot!.textContent).toBeFalsy();
    // Re-connect
    document.body.appendChild(tpl);
    expect(tpl.shadowRoot).toBe(shadowRoot);
    expect(tpl.shadowRoot.textContent).toBeTruthy();
    tpl.remove();
    expect(tpl.shadowRoot!.textContent).toBeFalsy();
  });

  test("with legacy v2 usage", () => {
    consoleWarn.mockReturnValue();
    consoleError.mockReturnValue();

    customTemplates.define("tpl-legacy", {
      bricks: [{ brick: "div" }],
      proxy: {
        properties: {
          propA: {
            ref: "ref-a",
          },
          propB: {
            ref: "ref-b",
            asVariable: true,
          },
          propC: {
            ref: "ref-c",
            mergeProperty: "columns",
          },
          propD: {
            ref: "ref-d",
            refTransform: {},
          },
          // A documentation-only proxy property
          stateX: {},
        } as any,
      },
      state: [{ name: "stateX" }, { name: "propA" }],
    });

    expect(consoleWarn).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledTimes(3);
    expect(consoleWarn).toHaveBeenCalledWith(
      "Template `asVariable` is deprecated in v3 and will be dropped in strict mode,",
      "tpl-legacy",
      "propB"
    );
    expect(consoleError).toHaveBeenNthCalledWith(
      1,
      "Template `mergeProperty` and `refTransform` are dropped in v3:",
      "tpl-legacy",
      "propC"
    );
    expect(consoleError).toHaveBeenNthCalledWith(
      2,
      "Template `mergeProperty` and `refTransform` are dropped in v3:",
      "tpl-legacy",
      "propD"
    );
    expect(consoleError).toHaveBeenNthCalledWith(
      3,
      'Cannot define an exposed state that is also a proxy property: "propA" in tpl-legacy'
    );

    consoleWarn.mockReset();
    consoleError.mockReset();
  });

  test("define a native prop", () => {
    consoleWarn.mockReturnValue();
    customTemplates.define("tpl-native-prop", {
      bricks: [{ brick: "div" }],
      state: [{ name: "title", expose: true }],
    });
    expect(consoleWarn).toHaveBeenCalledWith(
      "Using native HTMLElement properties as template properties or methods is deprecated in v3 and will be dropped in strict mode,",
      "tpl-native-prop",
      "title"
    );
    consoleWarn.mockReset();
  });

  test("define a native prop that is allowed", () => {
    customTemplates.define("tpl-native-prop-but-allowed", {
      bricks: [{ brick: "div" }],
      state: [{ name: "prefix", expose: true }],
    });
    expect(customTemplates.get("tpl-native-prop-but-allowed")).toEqual({
      name: "tpl-native-prop-but-allowed",
      proxy: {
        properties: {},
      },
      bricks: [{ brick: "div" }],
      state: [{ name: "prefix", expose: true }],
    });
  });

  test("define an existed custom elements", () => {
    consoleWarn.mockReturnValueOnce();

    customTemplates.define("tpl-existed", {
      bricks: [{ brick: "p" }],
    });
    expect(customTemplates.get("tpl-existed")).toEqual({
      name: "tpl-existed",
      proxy: {
        properties: {},
      },
      bricks: [{ brick: "p" }],
      state: [],
    });
    expect(consoleWarn).toHaveBeenCalledTimes(1);
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Custom template of "tpl-existed" already defined by customElements'
      )
    );

    const tpl = document.createElement("tpl-existed") as RuntimeBrickElement;
    expect(tpl.$$typeof).toBe(undefined);
    expect(tpl.constructor).toBe(TplExistedElement);
  });
});
