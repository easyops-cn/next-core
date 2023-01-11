import { Resolver, ResolveRequestError } from "./Resolver";
import { RuntimeBrick } from "./BrickNode";
import { CUSTOM_API_PROVIDER } from "../providers/CustomApi";
import * as runtime from "../core/Runtime";
import { registerStoryboardFunctions } from "./StoryboardFunctions";
import { computeRealValue } from "../internal/setProperties";

jest.mock("../handleHttpError");

jest
  .spyOn(runtime, "_internalApiGetMicroAppApiOrchestrationMap")
  .mockResolvedValue(
    new Map([
      [
        "easyops.custom_api@myAwesomeApi",
        {
          contract: {
            endpoint: {
              method: "POST",
              uri: "/object/:objectId/instance/_search",
            },
            name: "myAwesomeApi",
            response: {
              fields: [
                {
                  description: "instance list",
                  name: "list",
                  type: "map[]",
                },
              ],
              type: "object",
            },
          },
          name: "myAwesomeApi",
          namespace: "easyops.custom_api",
        },
      ],
    ])
  );

// Mock a custom element of `any-provider`.
customElements.define(
  "any-provider",
  class Tmp extends HTMLElement {
    resolve(): string {
      return "resolved";
    }
  }
);

// Mock a custom element of `any-provider`.
customElements.define(
  "error-provider",
  class Tmp extends HTMLElement {
    resolve(): Promise<unknown> {
      return Promise.reject(new Error("oops"));
    }
  }
);

registerStoryboardFunctions([
  {
    name: "makeCircularReferences",
    source: `function makeCircularReferences() {
      const a = {};
      a.a = a;
      return a;
    }`,
  },
]);

describe("Resolver", () => {
  const anyProvider = document.createElement("any-provider");
  const errorProvider = document.createElement("error-provider");
  const customApiProvider = document.createElement(CUSTOM_API_PROVIDER);
  const kernel = {
    mountPoints: {},
    getProviderBrick: jest
      .fn()
      .mockImplementation((brick: string) =>
        brick === "error-provider" ? errorProvider : anyProvider
      ),
  } as any;
  const locationContext = {
    storyboardContextWrapper: {
      waitForUsedContext: jest.fn().mockResolvedValue(undefined),
    },
    deferComputeRealValue(
      ...args: Parameters<typeof computeRealValue>
    ): Promise<unknown> {
      return Promise.resolve(computeRealValue(...args));
    },
  } as any;
  let resolver: Resolver;

  beforeEach(() => {
    resolver = new Resolver(kernel, locationContext);
  });

  it("should do nothing if nothing to resolve", async () => {
    const result = await resolver.resolve({} as any, null, null);
    expect(result).toBe(undefined);
  });

  it("should resolve bricks", async () => {
    const testMethod = jest.fn().mockResolvedValue({
      data: {
        hello: "world",
      },
    });
    const providerName = "any-provider";
    const provider = {
      tagName: providerName,
      testMethod,
      interval: {
        delay: 3000,
        ignoreErrors: true,
      },
    };
    kernel.mountPoints.bg = {
      querySelector: () => provider,
    } as any;
    const brickA: RuntimeBrick = {
      type: "brick-A",
      properties: {},
      events: {},
      lifeCycle: {
        useResolves: [
          {
            name: "testProp",
            provider: providerName,
            method: "testMethod",
          },
        ],
      },
    };
    const brickB: RuntimeBrick = {
      type: "brick-B",
      properties: {
        existedProp: "any",
      },
      events: {},
      lifeCycle: {
        useResolves: [
          {
            provider: "any-provider",
            method: "testMethod",
            transformFrom: "data",
            transform: {
              testProp: "${quality} @{hello}",
            },
          },
        ],
      },
    };
    resolver.resetRefreshQueue();
    await resolver.resolve(
      {
        lifeCycle: brickA.lifeCycle,
      },
      brickA,
      {
        match: {
          params: {
            quality: "better",
          },
        },
      } as any
    );
    await resolver.resolve(
      {
        lifeCycle: brickB.lifeCycle,
      },
      brickB,
      {
        match: {
          params: {
            quality: "better",
          },
        },
      } as any
    );
    const redirectConf = {};
    await resolver.resolveOne(
      "reference",
      {
        provider: "any-provider",
        method: "testMethod",
        transform: {
          redirect: "/go/to/@{data.hello}",
        },
      },
      redirectConf
    );
    expect(testMethod).toBeCalledTimes(1);
    expect(brickA.properties).toEqual({
      testProp: {
        data: {
          hello: "world",
        },
      },
    });
    expect(brickB.properties).toEqual({
      existedProp: "any",
      testProp: "better world",
    });
    expect(redirectConf).toEqual({
      redirect: "/go/to/world",
    });

    resolver.scheduleRefreshing();
    await jest.advanceTimersByTime(3000);
    expect(testMethod).toBeCalledTimes(2);
    resolver.resetRefreshQueue();
  });

  it("should handle cache with computed args which contain circular references", async () => {
    const testMethod = jest.fn().mockResolvedValue({
      data: {
        hello: "world",
      },
    });
    const providerName = "any-provider";
    const provider = {
      tagName: providerName,
      testMethod,
    };
    kernel.mountPoints.bg = {
      querySelector: () => provider,
    } as any;
    const brickA: RuntimeBrick = {
      type: "brick-A",
      properties: {},
      events: {},
      lifeCycle: {
        useResolves: [
          {
            name: "testProp",
            provider: providerName,
            method: "testMethod",
            args: ["<% FN.makeCircularReferences() %>"],
          },
        ],
      },
    };

    await resolver.resolve(
      {
        lifeCycle: brickA.lifeCycle,
      },
      brickA,
      {} as any
    );
    expect(testMethod).toBeCalledTimes(1);

    // Cache is ok when the computed args contain circular references.
    await resolver.resolve(
      {
        lifeCycle: brickA.lifeCycle,
      },
      brickA,
      {} as any
    );
    expect(testMethod).toBeCalledTimes(1);
  });

  it("should work for useProvider", async () => {
    const brickA: RuntimeBrick = {
      type: "brick-A",
      properties: {},
      events: {},
      lifeCycle: {
        useResolves: [
          {
            name: "testProp",
            useProvider: "any-provider",
          },
        ],
      },
    };
    await resolver.resolve(
      {
        lifeCycle: brickA.lifeCycle,
      },
      brickA,
      null
    );
    expect(brickA.properties.testProp).toBe("resolved");
  });

  it("should check if", async () => {
    const brickA: RuntimeBrick = {
      type: "brick-A",
      properties: {},
      events: {},
      lifeCycle: {
        useResolves: [
          {
            if: false,
            name: "testProp",
            useProvider: "any-provider",
          },
          {
            if: true,
            name: "existedProp",
            useProvider: "any-provider",
          },
        ],
      },
    };
    await resolver.resolve(
      {
        lifeCycle: brickA.lifeCycle,
      },
      brickA,
      null
    );
    expect(brickA.properties.testProp).toBe(undefined);
    expect(brickA.properties.existedProp).toBe("resolved");
  });

  it("should work for customApi", async () => {
    const brickA: RuntimeBrick = {
      type: "brick-A",
      properties: {},
      events: {},
      lifeCycle: {
        useResolves: [
          {
            name: "testProp",
            useProvider: "easyops.custom_api@myAwesomeApi",
            args: ["myObjectId"],
          },
        ],
      },
    };
    const mockResolve = jest.fn();
    const _getProviderBrick = kernel.getProviderBrick;
    kernel.getProviderBrick = jest
      .fn()
      .mockResolvedValue({ ...customApiProvider, resolve: mockResolve });
    await resolver.resolve(
      {
        lifeCycle: brickA.lifeCycle,
      },
      brickA,
      null
    );
    expect(mockResolve).toBeCalledWith({
      method: "POST",
      responseWrapper: true,
      url: "api/gateway/api_service.easyops.custom_api.myAwesomeApi/object/myObjectId/instance/_search",
      originalUri: "/object/:objectId/instance/_search",
      isFileType: false,
    });
    kernel.getProviderBrick = _getProviderBrick;
  });

  it("should handle reject", async () => {
    const testMethod = jest.fn().mockRejectedValue({
      message: "oops",
    });
    const providerName = "any-provider";
    const provider = {
      tagName: providerName,
      testMethod,
    };
    kernel.mountPoints.bg = {
      querySelector: () => provider,
    } as any;
    const brickA: RuntimeBrick = {
      type: "brick-A",
      properties: {},
      events: {},
      lifeCycle: {
        useResolves: [
          {
            name: "testProp",
            provider: providerName,
            method: "testMethod",
            onReject: {
              transform: {
                error: "@{message}",
                errorQuality: "${quality}",
              },
            },
          },
        ],
      },
    };
    const brickB: RuntimeBrick = {
      type: "brick-B",
      properties: {},
      events: {},
      lifeCycle: {
        useResolves: [
          {
            name: "testProp",
            provider: providerName,
            method: "testMethod",
            onReject: {
              transform: {
                error: "@{message}",
              },
            },
          },
        ],
      },
    };
    resolver.resetRefreshQueue();
    await resolver.resolve(
      {
        lifeCycle: brickA.lifeCycle,
      },
      brickA,
      {
        match: {
          params: {
            quality: "bad",
          },
        },
      } as any
    );
    await resolver.resolve(
      {
        lifeCycle: brickB.lifeCycle,
      },
      brickB
      // No context
    );
    expect(testMethod).toBeCalledTimes(1);
    expect(brickA.properties).toEqual({
      error: "oops",
      errorQuality: "bad",
    });
    expect(brickB.properties).toEqual({
      error: "oops",
    });
    resolver.resetRefreshQueue();
  });

  it("should handle reject when resolving context", async () => {
    const valueConf: Record<string, unknown> = {};
    await resolver.resolveOne(
      "reference",
      {
        transform: "value",
        transformMapArray: false,
        useProvider: "error-provider",
        onReject: {
          transform: {
            value: "@{message}",
          },
        },
      },
      valueConf,
      null,
      null
    );
    expect(valueConf).toEqual({
      value: "oops",
    });
  });

  it("should use defined resolves", async () => {
    const providerName = "any-provider";

    resolver.defineResolves(
      [
        {
          id: "provider-a",
          provider: providerName,
          method: "testMethod",
          args: ["good"],
          transformFrom: "data",
        },
      ],
      null
    );

    const testMethod = jest.fn().mockResolvedValue({
      data: {
        hello: "world",
      },
    });
    const provider = {
      tagName: providerName,
      testMethod,
    };
    kernel.mountPoints.bg = {
      querySelector: () => provider,
    } as any;

    const brickA: RuntimeBrick = {
      type: "brickA-A",
      properties: {},
      events: {},
      lifeCycle: {
        useResolves: [
          {
            name: "testProp",
            ref: "provider-a",
          },
        ],
      },
    };

    await resolver.resolve(
      {
        lifeCycle: brickA.lifeCycle,
      },
      brickA,
      null
    );

    expect(brickA.properties).toEqual({
      testProp: {
        hello: "world",
      },
    });
    expect(testMethod).toBeCalledWith("good");
  });

  it("should throw if provider not found", async () => {
    kernel.mountPoints.bg = {
      querySelector(): any {
        return null;
      },
    } as any;
    const brickA: RuntimeBrick = {
      type: "brick-A",
      properties: {},
      events: {},
      lifeCycle: {
        useResolves: [
          {
            name: "testProp",
            provider: "provider-a",
            method: "testMethod",
          },
        ],
      },
    };
    expect.assertions(1);
    try {
      await resolver.resolve(
        {
          brick: brickA.type,
          lifeCycle: brickA.lifeCycle,
        },
        brickA,
        null
      );
    } catch (error) {
      expect(error.message).toContain('Provider not found: "provider-a"');
    }
  });

  it("should throw if provider not defined", async () => {
    const provider = {
      tagName: "provider-not-defined",
    };
    kernel.mountPoints.bg = {
      querySelector: () => provider,
    } as any;

    const brickA: RuntimeBrick = {
      type: "brick-A",
      properties: {},
      events: {},
      lifeCycle: {
        useResolves: [
          {
            name: "testProp",
            provider: "provider-not-defined",
            method: "testMethod",
          },
        ],
      },
    };

    expect.assertions(1);
    try {
      await resolver.resolve(
        {
          brick: brickA.type,
          lifeCycle: brickA.lifeCycle,
        },
        brickA,
        null
      );
    } catch (error) {
      expect(error.message).toContain(
        'Provider not defined: "provider-not-defined"'
      );
    }
  });

  it("should throw if ref provider not found", async () => {
    resolver.defineResolves(undefined, null);
    const brickA: RuntimeBrick = {
      type: "brick-A",
      properties: {},
      events: {},
      lifeCycle: {
        useResolves: [
          {
            name: "testProp",
            ref: "provider-a",
          },
        ],
      },
    };
    expect.assertions(1);
    try {
      await resolver.resolve(
        {
          brick: brickA.type,
          lifeCycle: brickA.lifeCycle,
        },
        brickA,
        null
      );
    } catch (error) {
      expect(error.message).toContain('Provider ref not found: "provider-a"');
    }
  });

  it("should throw ResolveRequestError", async () => {
    const testMethod = jest.fn().mockRejectedValue({
      message: "oops",
    });
    const providerName = "any-provider";
    const provider = {
      tagName: providerName,
      testMethod,
    };
    kernel.mountPoints.bg = {
      querySelector: () => provider,
    } as any;
    const brickA: RuntimeBrick = {
      type: "brick-A",
      properties: {},
      events: {},
      lifeCycle: {
        useResolves: [
          {
            name: "testProp",
            provider: "any-provider",
            method: "testMethod",
            onReject: {
              isolatedCrash: true,
            },
          },
        ],
      },
    };
    expect.assertions(1);
    try {
      await resolver.resolve(
        {
          brick: brickA.type,
          lifeCycle: brickA.lifeCycle,
        },
        brickA,
        null
      );
    } catch (error) {
      expect(error).toBeInstanceOf(ResolveRequestError);
    }
  });
});
