import { jest, describe, test, expect } from "@jest/globals";
import { getProviderBrick } from "./getProviderBrick.js";
import { loadBricksImperatively } from "@next-core/loader";

jest.mock("@next-core/loader");
jest.mock("../Runtime.js", () => ({
  getBrickPackages() {
    return [];
  },
  hooks: {
    flowApi: {
      isFlowApiProvider(provider: string) {
        return provider.includes("@");
      },
      FLOW_API_PROVIDER: "core.provider-flow-api",
      registerFlowApiProvider: jest.fn(),
    },
  },
}));

(
  loadBricksImperatively as jest.MockedFunction<typeof loadBricksImperatively>
).mockImplementation((bricks) => {
  if ([...bricks][0] === "a-b") {
    customElements.define("a-b", class extends HTMLElement {});
  }
  return Promise.resolve();
});

describe("getProviderBrick", () => {
  test("general", async () => {
    const brick = await getProviderBrick("a-b");
    expect(brick.tagName).toBe("A-B");

    const brick2 = await getProviderBrick("a-b");
    expect(brick).toBe(brick2);
  });

  test("flow api", async () => {
    const brick = await getProviderBrick("a@b");
    expect(brick.tagName).toBe("CORE.PROVIDER-FLOW-API");
  });

  test("not custom element", async () => {
    const brick = await getProviderBrick("div");
    expect(brick.tagName).toBe("DIV");
  });

  test("provider not defined", async () => {
    expect(() => getProviderBrick("x-y")).rejects.toMatchInlineSnapshot(
      `[Error: Provider not defined: "x-y".]`
    );
  });
});
