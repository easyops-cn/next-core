import { WATEMARK_BRICKNAME, setWatermark } from "./setWatermark";
import { getRuntime } from "../runtime";
import { getAuth } from "../auth";

jest.mock("../runtime");
jest.mock("../auth");
jest.mock("@next-core/loader", () => ({
  loadBricksImperatively: jest.fn(() => Promise.resolve()),
}));
(getAuth as jest.Mock).mockReturnValue({
  username: "easyops",
  userInstanceId: "acbd46b",
  accessRule: "cmdb",
  isAdmin: false,
});

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
  setVersion();
  jest.clearAllMocks();
});

describe("setWatermark", () => {
  it("general should work", async () => {
    (getRuntime as jest.Mock).mockImplementation(() => ({
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
      getBrickPackages: () => ({}),
    }));
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
    (getRuntime as jest.Mock).mockImplementation(() => ({
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
    }));
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

    (getRuntime as jest.Mock).mockImplementation(() => ({
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
    }));

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
    (getRuntime as jest.Mock).mockImplementation(() => ({
      getFeatureFlags: () => ({
        "show-watermark": false,
      }),
      getMiscSettings: () => ({
        flags: {
          "show-development": true,
        },
      }),
      getBrickPackages: () => ({}),
    }));
    await setWatermark();

    expect(mockResolve).not.toBeCalled();
  });
});
