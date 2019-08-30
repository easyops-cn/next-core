import { Resolver } from "./Resolver";
import { RuntimeBrick } from "./BrickNode";

describe("Resolver", () => {
  const resolver = new Resolver();

  beforeEach(() => {
    resolver.resetCache();
  });

  it("should do nothing if nothing to resolve", async () => {
    const result = await resolver.resolve([], null);
    expect(result).toBe(undefined);
  });

  it("should resolve", async () => {
    const bg = {
      querySelector() {
        return {
          testMethod: jest.fn().mockResolvedValue({
            data: {
              hello: "world"
            }
          })
        };
      }
    } as any;
    const bricks: RuntimeBrick[] = [
      {
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
      },
      {
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
      }
    ];
    await resolver.resolve(bricks, bg);
    expect(bricks[0].properties).toEqual({
      testProp: {
        data: {
          hello: "world"
        }
      }
    });
    expect(bricks[1].properties).toEqual({
      existedProp: "any",
      testProp: "world"
    });
  });

  it("should throw if provider not found", async () => {
    const bg = {
      querySelector() {
        return null;
      }
    } as any;
    const bricks: RuntimeBrick[] = [
      {
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
      }
    ];
    expect.assertions(1);
    try {
      await resolver.resolve(bricks, bg);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});
