import { WATEMARK_BRICKNAME, setWatermark } from "./setWatermark.js";

let mockRunTime: any;

jest.mock("./internal/Runtime.js", () => ({
  hooks: {
    auth: {
      getAuth() {
        return {
          username: "easyops",
        };
      },
    },
  },
  getRuntime: () => mockRunTime,
  getBrickPackages: () => ({}),
}));
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

function setVersion(version = "0.0.0"): void {
  window.APP_ROOT = `sa-static/visual-builder/versions/${version}/webroot/`;
}

beforeEach(() => {
  jest.clearAllMocks();
  setVersion();
  mockRunTime = {
    getFeatureFlags: () => ({
      "show-watermark": true,
    }),
    getMiscSettings: () => ({
      watermarkConfig: {
        flags: {
          "show-development": true,
          "show-user": true,
        },
      },
    }),
  } as any;
});

describe("setWatermark", () => {
  it("general should work", async () => {
    await setWatermark();

    expect(mockResolve).toHaveBeenNthCalledWith(1, {
      content: ["Development", "easyops"],
      font: { fontSize: 28 },
      gap: [190, 190],
      width: 200,
      zIndex: 1001,
    });

    setVersion("1.0.0");

    await setWatermark();

    expect(mockResolve).toHaveBeenNthCalledWith(2, {
      content: ["easyops"],
      font: { fontSize: 28 },
      gap: [190, 190],
      width: 200,
      zIndex: 1001,
    });
  });

  it("mics settings should work", async () => {
    mockRunTime = {
      getFeatureFlags: () => ({
        "show-watermark": true,
      }),
      getMiscSettings: () => ({
        watermarkConfig: {
          content: "Hello World",
          flags: {
            "show-development": true,
          },
        },
      }),
      getBrickPackages: () => ({}),
    };
    await setWatermark();

    expect(mockResolve).toHaveBeenNthCalledWith(1, {
      content: ["Hello World", "Development"],
      font: { fontSize: 28 },
      gap: [190, 190],
      width: 200,
      zIndex: 1001,
    });

    setVersion("1.0.0");
    await setWatermark();

    expect(mockResolve).toHaveBeenNthCalledWith(2, {
      content: ["Hello World"],
      font: { fontSize: 28 },
      gap: [190, 190],
      width: 200,
      zIndex: 1001,
    });

    mockRunTime = {
      getFeatureFlags: () => ({
        "show-watermark": true,
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
          flags: {
            "show-development": false,
          },
        },
      }),
      getBrickPackages: () => ({}),
    };

    setVersion("1.0.0");
    await setWatermark();

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
    mockRunTime = {
      getFeatureFlags: () => ({
        "show-watermark": false,
      }),
      getMiscSettings: () => ({
        watermarkConfig: {
          flags: {
            "show-development": true,
          },
        },
      }),
      getBrickPackages: () => ({}),
    };
    await setWatermark();

    expect(mockResolve).not.toBeCalled();
  });
});
