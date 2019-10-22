import { Resolver } from "./Resolver";
import { RuntimeBrick } from "./BrickNode";

jest.mock("../handleHttpError");

describe("Resolver", () => {
  const kernel = {
    mountPoints: {}
  } as any;
  let resolver: Resolver;

  beforeEach(() => {
    resolver = new Resolver(kernel as any);
  });

  it("should do nothing if nothing to resolve", async () => {
    const result = await resolver.resolve({} as any, null, null);
    expect(result).toBe(undefined);
  });

  it("should resolve bricks", async () => {
    const testMethod = jest.fn().mockResolvedValue({
      data: {
        hello: "world"
      }
    });
    const provider = {
      testMethod,
      interval: {
        delay: 3000,
        ignoreErrors: true
      }
    };
    kernel.mountPoints.bg = {
      querySelector: () => provider
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
            method: "testMethod"
          }
        ]
      }
    };
    const brickB: RuntimeBrick = {
      type: "brick-B",
      properties: {
        existedProp: "any"
      },
      events: {},
      lifeCycle: {
        useResolves: [
          {
            name: "testProp",
            provider: "any-provider",
            method: "testMethod",
            field: "data.hello"
          }
        ]
      }
    };
    resolver.resetRefreshQueue();
    await resolver.resolve(
      {
        lifeCycle: brickA.lifeCycle
      },
      brickA,
      null
    );
    await resolver.resolve(
      {
        lifeCycle: brickB.lifeCycle
      },
      brickB,
      null
    );
    expect(testMethod).toBeCalledTimes(1);
    expect(brickA.properties).toEqual({
      testProp: {
        data: {
          hello: "world"
        }
      }
    });
    expect(brickB.properties).toEqual({
      existedProp: "any",
      testProp: "world"
    });

    resolver.scheduleRefreshing();
    await jest.runTimersToTime(3000);
    expect(testMethod).toBeCalledTimes(2);
    resolver.resetRefreshQueue();
  });

  it("should throw if provider not found", async () => {
    kernel.mountPoints.bg = {
      querySelector(): any {
        return null;
      }
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
            method: "testMethod"
          }
        ]
      }
    };
    expect.assertions(1);
    try {
      await resolver.resolve(
        {
          brick: brickA.type,
          lifeCycle: brickA.lifeCycle
        },
        brickA,
        null
      );
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});
