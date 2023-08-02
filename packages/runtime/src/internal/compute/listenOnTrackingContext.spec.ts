import {
  listenOnTrackingContext,
  TrackingContextItem,
} from "./listenOnTrackingContext.js";
import type { RuntimeBrick, RuntimeContext } from "../interfaces.js";
import { DataStore } from "../data/DataStore.js";

const ctxStore = new DataStore("CTX");

const tplStateStoreMap = new Map<string, DataStore<"STATE">>();
const stateStore = new DataStore("STATE");
const tplStateStoreId = "tpl-state-0";
tplStateStoreMap.set(tplStateStoreId, stateStore);

const formStateStoreMap = new Map<string, DataStore<"FORM_STATE">>();
const formStore = new DataStore("FORM_STATE");
const formStateStoreId = "form-state-0";
formStateStoreMap.set(formStateStoreId, formStore);

const runtimeContext = {
  ctxStore,
  tplStateStoreId,
  tplStateStoreMap,
  formStateStoreId,
  formStateStoreMap,
} as Partial<RuntimeContext> as RuntimeContext;

ctxStore.define(
  [
    {
      name: "hello",
      value: "Hello",
    },
    {
      name: "world",
    },
  ],
  runtimeContext
);

stateStore.define(
  [
    {
      name: "hola",
    },
  ],
  runtimeContext
);

formStore.define(
  [
    {
      name: "good",
    },
  ],
  runtimeContext
);

const preTplStateStoreMap = new Map<string, DataStore<"STATE">>();
const preStateStore = new DataStore("STATE");
const preTplStateStoreId = "tpl-state-1";
preTplStateStoreMap.set(preTplStateStoreId, preStateStore);

const preFormStateStoreMap = new Map<string, DataStore<"FORM_STATE">>();
const preFormStore = new DataStore("FORM_STATE");
const preFormStateStoreId = "form-state-1";
preFormStateStoreMap.set(preFormStateStoreId, preFormStore);

const preRuntimeContext = {
  tplStateStoreId: preTplStateStoreId,
  tplStateStoreMap: preTplStateStoreMap,
  formStateStoreId: preFormStateStoreId,
  formStateStoreMap: preFormStateStoreMap,
} as Partial<RuntimeContext> as RuntimeContext;

preStateStore.define(
  [
    {
      name: "preHola",
    },
  ],
  preRuntimeContext
);

preFormStore.define(
  [
    {
      name: "preGood",
    },
  ],
  preRuntimeContext
);

describe("listenOnTrackingContext", () => {
  const trackingContextList: TrackingContextItem[] = [
    {
      contextNames: ["hello", "world"],
      stateNames: false,
      propName: "title",
      formStateNames: false,
      propValue: "<%= CTX.hello + CTX.world %>",
    },
    {
      contextNames: false,
      stateNames: ["hola"],
      formStateNames: false,
      propName: "textContent",
      propValue: "<%= STATE.hola %>",
    },
    {
      contextNames: false,
      stateNames: false,
      formStateNames: ["good"],
      propName: "textContent",
      propValue: "<%= FORM_STATE.good %>",
    },
  ];

  const preTrackingContextList: TrackingContextItem[] = [
    {
      contextNames: false,
      stateNames: ["preHola"],
      propName: "textContent",
      formStateNames: false,
      propValue: {
        [Symbol.for("pre.evaluated.raw")]: "<%= STATE.preHola %>",
        [Symbol.for("pre.evaluated.context")]: preRuntimeContext,
      },
    },
    {
      contextNames: false,
      stateNames: false,
      formStateNames: ["preGood"],
      propName: "textContent",
      propValue: {
        [Symbol.for("pre.evaluated.raw")]: "<%= FORM_STATE.preGood %>",
        [Symbol.for("pre.evaluated.context")]: preRuntimeContext,
      },
    },
  ];

  it("should update brick properties when context changed", () => {
    const brick: RuntimeBrick = {
      element: document.createElement("div"),
      type: "div",
      runtimeContext,
    };
    listenOnTrackingContext(brick, trackingContextList);
    ctxStore.updateValue("world", "World", "replace");
    expect(brick.element?.title).toBe("HelloWorld");
  });

  it("should update brick properties when tpl state changed", () => {
    const brick: RuntimeBrick = {
      element: document.createElement("div"),
      type: "div",
      runtimeContext,
    };
    listenOnTrackingContext(brick, trackingContextList);
    stateStore.updateValue("hola", "Hola", "replace");
    expect(brick.element?.textContent).toBe("Hola");
  });

  it("should update brick properties when form state changed", () => {
    const brick: RuntimeBrick = {
      element: document.createElement("div"),
      type: "div",
      runtimeContext,
    };
    listenOnTrackingContext(brick, trackingContextList);
    formStore.updateValue("good", "Better", "replace");
    expect(brick.element?.textContent).toBe("Better");
  });

  it("should update brick properties when tpl state changed with pre-evaluated", () => {
    const brick: RuntimeBrick = {
      element: document.createElement("div"),
      type: "div",
      runtimeContext: {
        ...runtimeContext,
        tplStateStoreId: preTplStateStoreId,
      },
    };
    listenOnTrackingContext(brick, preTrackingContextList);
    preStateStore.updateValue("preHola", "PreHola", "replace");
    expect(brick.element?.textContent).toBe("PreHola");
  });

  it("should update brick properties when form state changed with pre-evaluated", () => {
    const brick: RuntimeBrick = {
      element: document.createElement("div"),
      type: "div",
      runtimeContext: {
        ...runtimeContext,
        formStateStoreId: preFormStateStoreId,
      },
    };
    listenOnTrackingContext(brick, preTrackingContextList);
    preFormStore.updateValue("preGood", "PreBetter", "replace");
    expect(brick.element?.textContent).toBe("PreBetter");
  });

  it("should do nothing if brick has no element when context changed", () => {
    const brick: RuntimeBrick = {
      type: "div",
      runtimeContext,
    };
    listenOnTrackingContext(brick, trackingContextList);
    ctxStore.updateValue("world", "Oops", "replace");
  });
});
