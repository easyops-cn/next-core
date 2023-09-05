import { describe, jest, test, expect } from "@jest/globals";
import {
  loadBricksImperatively as _loadBricksImperatively,
  loadProcessorsImperatively as _loadProcessorsImperatively,
  enqueueStableLoadBricks as _enqueueStableLoadBricks,
  flushStableLoadBricks as _flushStableLoadBricks,
  enqueueStableLoadProcessors as _enqueueStableLoadProcessors,
} from "./stableLoadBricks.js";

const consoleError = jest.spyOn(console, "error");
const consoleInfo = jest.spyOn(console, "info").mockReturnValue();
let requestsCount = 0;
jest.spyOn(window, "dispatchEvent").mockImplementation((event) => {
  if (event.type === "request.start") {
    requestsCount++;
  } else {
    requestsCount--;
  }
  return true;
});

jest.mock("./loadScript.js", () => ({
  __esModule: true,
  default: jest.fn(
    (src: string, prefix?: string) =>
      new Promise<void>((resolve) =>
        setTimeout(() => {
          // eslint-disable-next-line no-console
          console.info("loadScript done:", src, prefix);
          resolve();
        }, 50)
      )
  ),
}));
jest.mock("./loadSharedModule.js", () => ({
  __esModule: true,
  default: jest.fn(
    (scope: string, module: string) =>
      new Promise<void>((resolve, reject) =>
        setTimeout(() => {
          if (module === "./not-existed") {
            // eslint-disable-next-line no-console
            console.info("loadSharedModule failed:", scope, module);
            reject(new Error("oops"));
          } else {
            // eslint-disable-next-line no-console
            console.info("loadSharedModule done:", scope, module);
            resolve();
          }
        }, 100)
      )
  ),
}));

const loadV2Bricks = jest.fn(
  () => new Promise((resolve) => setTimeout(resolve, 100))
);
customElements.define(
  "v2-adapter.load-bricks",
  class extends HTMLElement {
    resolve = loadV2Bricks;
  }
);

beforeEach(() => {
  requestsCount = 0;
});

describe("loadBricksImperatively", () => {
  let loadBricksImperatively: typeof _loadBricksImperatively;

  beforeEach(() => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const m = require("./stableLoadBricks.js");
      loadBricksImperatively = m.loadBricksImperatively;
    });
  });

  test("load a single brick", async () => {
    const promise = loadBricksImperatively(
      ["basic.general-button"],
      [
        {
          id: "bricks/basic",
          filePath: "bricks/basic/dist/index.hash.js",
        },
      ]
    );
    expect(requestsCount).toBe(1);
    await promise;
    expect(requestsCount).toBe(0);
    expect(consoleInfo).toBeCalledTimes(2);
    expect(consoleInfo).toHaveBeenNthCalledWith(
      1,
      "loadScript done:",
      "bricks/basic/dist/index.hash.js",
      ""
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      2,
      "loadSharedModule done:",
      "bricks/basic",
      "./general-button"
    );
  });

  test("load multiple bricks with dependencies", async () => {
    const promise = loadBricksImperatively(
      ["advanced.general-table", "basic.general-button", "basic.general-link"],
      [
        {
          id: "bricks/basic",
          filePath: "bricks/basic/dist/index.hash.js",
        },
        {
          id: "bricks/advanced",
          filePath: "bricks/advanced/dist/index.hash.js",
          dependencies: {
            "advanced.general-table": [
              "basic.general-link",
              "basic.general-tag",
            ],
          },
        },
      ]
    );
    expect(requestsCount).toBe(1);
    await promise;
    expect(requestsCount).toBe(0);
    expect(consoleInfo).toBeCalledTimes(6);
    expect(consoleInfo).toHaveBeenNthCalledWith(
      1,
      "loadScript done:",
      "bricks/basic/dist/index.hash.js",
      ""
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      2,
      "loadScript done:",
      "bricks/advanced/dist/index.hash.js",
      ""
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      3,
      "loadSharedModule done:",
      "bricks/basic",
      "./general-link"
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      4,
      "loadSharedModule done:",
      "bricks/basic",
      "./general-tag"
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      5,
      "loadSharedModule done:",
      "bricks/basic",
      "./general-button"
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      6,
      "loadSharedModule done:",
      "bricks/advanced",
      "./general-table"
    );
  });

  test("load v2 bricks", async () => {
    const brickPackages = [
      {
        id: "bricks/basic",
        filePath: "bricks/basic/dist/index.hash.js",
      },
      {
        id: "bricks/icons",
        filePath: "bricks/icons/dist/index.hash.js",
      },
      {
        id: "bricks/v2-adapter",
        filePath: "bricks/v2-adapter/dist/index.hash.js",
        dependencies: {
          "v2-adapter.load-bricks": ["icons.general-icon"],
        },
      },
      {
        filePath: "bricks/legacy/dist/index.hash.js",
        dll: ["d3"],
      },
    ];
    const promise = loadBricksImperatively(
      ["legacy.some-brick", "basic.general-button"],
      brickPackages as any
    );
    expect(requestsCount).toBe(1);
    await promise;
    expect(requestsCount).toBe(0);
    expect(consoleInfo).toBeCalledTimes(6);
    expect(consoleInfo).toHaveBeenNthCalledWith(
      1,
      "loadScript done:",
      "bricks/basic/dist/index.hash.js",
      ""
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      2,
      "loadScript done:",
      "bricks/v2-adapter/dist/index.hash.js",
      ""
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      3,
      "loadScript done:",
      "bricks/icons/dist/index.hash.js",
      ""
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      4,
      "loadSharedModule done:",
      "bricks/basic",
      "./general-button"
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      5,
      "loadSharedModule done:",
      "bricks/v2-adapter",
      "./load-bricks"
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      6,
      "loadSharedModule done:",
      "bricks/icons",
      "./general-icon"
    );
    expect(consoleError).toBeCalledTimes(0);
    expect(loadV2Bricks).toBeCalledTimes(1);
    expect(loadV2Bricks).toBeCalledWith(
      "bricks/v2-adapter/dist/index.hash.js",
      "bricks/legacy/dist/index.hash.js",
      ["legacy.some-brick"],
      ["d3"],
      brickPackages
    );
  });

  test("load v2 bricks without v2-adapter", async () => {
    consoleError.mockReturnValueOnce();
    const promise = loadBricksImperatively(
      ["legacy.some-brick", "basic.general-button"],
      [
        {
          id: "bricks/basic",
          filePath: "bricks/basic/dist/index.hash.js",
        },
        {
          filePath: "bricks/legacy/dist/index.hash.js",
        } as any,
      ]
    );
    expect(requestsCount).toBe(1);
    await promise;
    expect(requestsCount).toBe(0);
    expect(consoleInfo).toHaveBeenNthCalledWith(
      1,
      "loadScript done:",
      "bricks/basic/dist/index.hash.js",
      ""
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      2,
      "loadSharedModule done:",
      "bricks/basic",
      "./general-button"
    );
    expect(consoleInfo).toBeCalledTimes(2);
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith(
      "Using v2 bricks, but v2-adapter not found"
    );
  });

  test("load third-party bricks with no namespace", async () => {
    const promise = loadBricksImperatively(
      ["sl-alert"],
      [
        {
          id: "bricks/shoelace",
          filePath: "bricks/shoelace/dist/index.hash.js",
          elements: ["sl-alert", "sl-icon", "sl-button"],
        },
      ]
    );
    expect(requestsCount).toBe(1);
    await promise;
    expect(requestsCount).toBe(0);
    expect(consoleInfo).toBeCalledTimes(2);
    expect(consoleInfo).toHaveBeenNthCalledWith(
      1,
      "loadScript done:",
      "bricks/shoelace/dist/index.hash.js",
      ""
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      2,
      "loadSharedModule done:",
      "bricks/shoelace",
      "./sl-alert"
    );
  });

  test("load unknown brick", async () => {
    consoleError.mockReturnValueOnce();
    const promise = loadBricksImperatively(
      ["sl-alert"],
      [
        {
          id: "bricks/shoelace",
          filePath: "bricks/shoelace/dist/index.hash.js",
        },
      ]
    );
    expect(requestsCount).toBe(1);
    await promise;
    expect(requestsCount).toBe(0);
    expect(consoleError).toBeCalledTimes(1);
  });

  test("load brick failed", async () => {
    consoleError.mockReturnValueOnce();
    const promise = expect(
      loadBricksImperatively(
        ["unsure.not-existed"],
        [
          {
            id: "bricks/unsure",
            filePath: "bricks/unsure/dist/index.hash.js",
          },
        ]
      )
    ).rejects.toMatchInlineSnapshot(
      `[Error: Load bricks of "unsure.not-existed" failed]`
    );
    expect(requestsCount).toBe(1);
    await promise;
    expect(requestsCount).toBe(0);
    expect(consoleInfo).toBeCalledTimes(2);
    expect(consoleInfo).toHaveBeenNthCalledWith(
      1,
      "loadScript done:",
      "bricks/unsure/dist/index.hash.js",
      ""
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      2,
      "loadSharedModule failed:",
      "bricks/unsure",
      "./not-existed"
    );
    expect(consoleError).toBeCalledTimes(1);
  });
});

describe("enqueueStableLoadBricks", () => {
  let enqueueStableLoadBricks: typeof _enqueueStableLoadBricks;
  let flushStableLoadBricks: typeof _flushStableLoadBricks;

  beforeEach(() => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const m = require("./stableLoadBricks.js");
      enqueueStableLoadBricks = m.enqueueStableLoadBricks;
      flushStableLoadBricks = m.flushStableLoadBricks;
    });
  });

  test("enqueue", async () => {
    const brickPackages = [
      {
        id: "bricks/basic",
        filePath: "bricks/basic/dist/index.hash.js",
      },
      {
        id: "bricks/advanced",
        filePath: "bricks/advanced/dist/index.hash.js",
        dependencies: {
          "advanced.general-table": ["basic.general-link", "basic.general-tag"],
        },
      },
    ];
    const promises = [
      enqueueStableLoadBricks(["advanced.general-table"], brickPackages),
      enqueueStableLoadBricks(["basic.general-button"], brickPackages),
      enqueueStableLoadBricks(["basic.general-link"], brickPackages),
    ];
    flushStableLoadBricks();
    expect(requestsCount).toBe(3);
    await Promise.all(promises);
    expect(requestsCount).toBe(0);
    expect(consoleInfo).toBeCalledTimes(9);
    expect(consoleInfo).toHaveBeenNthCalledWith(
      1,
      "loadScript done:",
      "bricks/basic/dist/index.hash.js",
      ""
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      2,
      "loadScript done:",
      "bricks/advanced/dist/index.hash.js",
      ""
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      3,
      "loadScript done:",
      "bricks/basic/dist/index.hash.js",
      ""
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      4,
      "loadScript done:",
      "bricks/basic/dist/index.hash.js",
      ""
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      5,
      "loadSharedModule done:",
      "bricks/basic",
      "./general-link"
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      6,
      "loadSharedModule done:",
      "bricks/basic",
      "./general-tag"
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      7,
      "loadSharedModule done:",
      "bricks/advanced",
      "./general-table"
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      8,
      "loadSharedModule done:",
      "bricks/basic",
      "./general-button"
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      9,
      "loadSharedModule done:",
      "bricks/basic",
      "./general-link"
    );
  });

  test("enqueue with no basic", async () => {
    const brickPackages = [
      {
        id: "bricks/advanced",
        filePath: "bricks/advanced/dist/index.hash.js",
      },
    ];
    const promises = [
      enqueueStableLoadBricks(["advanced.general-table"], brickPackages),
    ];
    flushStableLoadBricks();
    expect(requestsCount).toBe(1);
    await Promise.all(promises);
    expect(requestsCount).toBe(0);
    expect(consoleInfo).toBeCalledTimes(2);
    expect(consoleInfo).toHaveBeenNthCalledWith(
      1,
      "loadScript done:",
      "bricks/advanced/dist/index.hash.js",
      ""
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      2,
      "loadSharedModule done:",
      "bricks/advanced",
      "./general-table"
    );
  });
});

describe("enqueueStableLoadProcessors", () => {
  let enqueueStableLoadProcessors: typeof _enqueueStableLoadProcessors;
  let flushStableLoadBricks: typeof _flushStableLoadBricks;

  beforeEach(() => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const m = require("./stableLoadBricks.js");
      enqueueStableLoadProcessors = m.enqueueStableLoadProcessors;
      flushStableLoadBricks = m.flushStableLoadBricks;
    });
  });

  test("enqueue", async () => {
    const brickPackages = [
      {
        id: "bricks/my-3d",
        filePath: "bricks/my-3d/dist/index.hash.js",
      },
    ];
    const promises = [
      enqueueStableLoadProcessors(["my_3d.getOutput"], brickPackages),
    ];
    flushStableLoadBricks();
    expect(requestsCount).toBe(1);
    await Promise.all(promises);
    expect(requestsCount).toBe(0);
    expect(consoleInfo).toBeCalledTimes(2);
    expect(consoleInfo).toHaveBeenNthCalledWith(
      1,
      "loadScript done:",
      "bricks/my-3d/dist/index.hash.js",
      ""
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      2,
      "loadSharedModule done:",
      "bricks/my-3d",
      "./processors/getOutput"
    );
  });
});

describe("loadProcessorsImperatively", () => {
  let loadProcessorsImperatively: typeof _loadProcessorsImperatively;

  beforeEach(() => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const m = require("./stableLoadBricks.js");
      loadProcessorsImperatively = m.loadProcessorsImperatively;
    });
  });

  test("load multiple processors", async () => {
    const promise = loadProcessorsImperatively(
      ["myPkg.sayGoodbye", "basic.sayHello"],
      [
        {
          id: "bricks/basic",
          filePath: "bricks/basic/dist/index.hash.js",
        },
        {
          id: "bricks/my-pkg",
          filePath: "bricks/my-pkg/dist/index.hash.js",
        },
      ]
    );
    expect(requestsCount).toBe(1);
    await promise;
    expect(requestsCount).toBe(0);
    expect(consoleInfo).toBeCalledTimes(4);
    expect(consoleInfo).toHaveBeenNthCalledWith(
      1,
      "loadScript done:",
      "bricks/basic/dist/index.hash.js",
      ""
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      2,
      "loadScript done:",
      "bricks/my-pkg/dist/index.hash.js",
      ""
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      3,
      "loadSharedModule done:",
      "bricks/basic",
      "./processors/sayHello"
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      4,
      "loadSharedModule done:",
      "bricks/my-pkg",
      "./processors/sayGoodbye"
    );
  });

  test("load v2 processors", async () => {
    const brickPackages = [
      {
        id: "bricks/v2-adapter",
        filePath: "bricks/v2-adapter/dist/index.hash.js",
      },
      {
        filePath: "bricks/legacy/dist/index.hash.js",
      },
    ];
    const promise = loadProcessorsImperatively(
      ["legacy.saySomething"],
      brickPackages as any
    );
    expect(requestsCount).toBe(1);
    await promise;
    expect(requestsCount).toBe(0);
    expect(consoleInfo).toBeCalledTimes(2);
    expect(consoleInfo).toHaveBeenNthCalledWith(
      1,
      "loadScript done:",
      "bricks/v2-adapter/dist/index.hash.js",
      ""
    );
    expect(consoleInfo).toHaveBeenNthCalledWith(
      2,
      "loadSharedModule done:",
      "bricks/v2-adapter",
      "./load-bricks"
    );
    expect(consoleError).toBeCalledTimes(0);
    expect(loadV2Bricks).toBeCalledTimes(1);
    expect(loadV2Bricks).toBeCalledWith(
      "bricks/v2-adapter/dist/index.hash.js",
      "bricks/legacy/dist/index.hash.js",
      [],
      undefined,
      brickPackages
    );
  });
});
