import { Resolver } from "./Resolver";
import { RuntimeBrick } from "./BrickNode";

jest.mock("../handleHttpError");

describe("Resolver", () => {
  const kernel = {
    mountPoints: {},
  } as any;
  let resolver: Resolver;

  beforeEach(() => {
    (window as any).customElements = {
      get: (name: string) => true,
    };
    resolver = new Resolver(kernel as any);
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
    await jest.runTimersToTime(3000);
    expect(testMethod).toBeCalledTimes(2);
    resolver.resetRefreshQueue();
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

  it("should use defined resolves", async () => {
    const providerName = "your-provider";

    resolver.defineResolves([
      {
        id: "provider-a",
        provider: providerName,
        method: "testMethod",
        args: ["good"],
        transformFrom: "data",
      },
    ]);

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
            provider: "any-provider",
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
      expect(error).toBeInstanceOf(Error);
    }
  });

  it("should throw if provider not defined", async () => {
    (window as any).customElements = {
      get: (name: string) => false,
    };

    const testMethod = jest.fn().mockResolvedValue({
      data: {
        hello: "world",
      },
    });
    const provider = {
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
      expect(error).toBeInstanceOf(Error);
    }
  });

  it("should throw if ref provider not found", async () => {
    resolver.defineResolves(undefined);
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
      expect(error).toBeInstanceOf(Error);
    }
  });
});
