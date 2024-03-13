import { getRuntime } from "./internal/Runtime.js";
import { WATEMARK_BRICKNAME, setWatermark } from "./setWatermark.js";

jest.mock("./internal/Runtime.js");
jest.mock("@next-core/loader", () => ({
  loadBricksImperatively: jest.fn(() => Promise.resolve()),
}));

const mockResolve = jest.fn();
customElements.define(
  WATEMARK_BRICKNAME,
  class extends HTMLElement {
    resolve = mockResolve;
  }
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("setWatermark", () => {
  it("general should work", async () => {
    (getRuntime as jest.Mock).mockImplementation(() => ({
      getFeatureFlags: () => ({
        "show-watermark": true,
        "show-developer-watermark": true,
        "show-user-watermark": true,
      }),
      getMiscSettings: () => ({}),
      getBrickPackages: () => ({}),
    }));
    await setWatermark({
      version: "0.0.0",
      username: "easyops",
    });

    expect(mockResolve).toHaveBeenNthCalledWith(1, {
      content: ["Developer", "easyops"],
      font: { fontSize: 28 },
      gap: [190, 190],
      width: 200,
      zIndex: 1001,
    });

    await setWatermark({
      version: "1.0.0",
      username: "easyops",
    });

    expect(mockResolve).toHaveBeenNthCalledWith(2, {
      content: ["easyops"],
      font: { fontSize: 28 },
      gap: [190, 190],
      width: 200,
      zIndex: 1001,
    });
  });

  it("mics settings should work", async () => {
    (getRuntime as jest.Mock).mockImplementation(() => ({
      getFeatureFlags: () => ({
        "show-watermark": true,
        "show-developer-watermark": true,
      }),
      getMiscSettings: () => ({
        watermarkConfig: {
          content: "Hello World",
        },
      }),
      getBrickPackages: () => ({}),
    }));
    await setWatermark({
      version: "0.0.0",
      username: "easyops",
    });

    expect(mockResolve).toHaveBeenNthCalledWith(1, {
      content: ["Hello World", "Developer"],
      font: { fontSize: 28 },
      gap: [190, 190],
      width: 200,
      zIndex: 1001,
    });

    await setWatermark({
      version: "1.0.0",
      username: "easyops",
    });

    expect(mockResolve).toHaveBeenNthCalledWith(2, {
      content: ["Hello World"],
      font: { fontSize: 28 },
      gap: [190, 190],
      width: 200,
      zIndex: 1001,
    });

    (getRuntime as jest.Mock).mockImplementation(() => ({
      getFeatureFlags: () => ({
        "show-watermark": true,
        "show-developer-watermark": false,
      }),
      getMiscSettings: () => ({
        watermarkConfig: {
          content: ["Hello", "World"],
          font: {
            fontSize: 20,
          },
          width: 220,
          height: 100,
          gap: [200, 200],
        },
      }),
      getBrickPackages: () => ({}),
    }));

    await setWatermark({
      version: "1.0.0",
      username: "easyops",
    });

    expect(mockResolve).toHaveBeenNthCalledWith(3, {
      content: ["Hello", "World"],
      font: { fontSize: 20 },
      gap: [200, 200],
      width: 220,
      height: 100,
      zIndex: 1001,
    });
  });

  it("watermark should not work when flag was false", async () => {
    (getRuntime as jest.Mock).mockImplementation(() => ({
      getFeatureFlags: () => ({
        "show-watermark": false,
        "show-developer-watermark": true,
      }),
      getMiscSettings: () => ({}),
      getBrickPackages: () => ({}),
    }));
    await setWatermark({
      version: "0.0.0",
      username: "easyops",
    });

    expect(mockResolve).not.toBeCalled();
  });
});
