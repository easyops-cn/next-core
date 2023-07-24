import { resizeScreenshot } from "./resizeScreenshot.js";

describe("resizeScreenshot", () => {
  const drawImage = jest.fn();
  const targetCanvas = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getContext(contextId: "2d") {
      return {
        drawImage,
      } as any;
    },
    toDataURL() {
      return "data:image/png;base64";
    },
  } as HTMLCanvasElement;

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("wider ratio", () => {
    const sourceCanvas = {
      width: 400,
      height: 200,
    } as HTMLCanvasElement;
    const screenshot = resizeScreenshot(sourceCanvas, targetCanvas, 200, 150);
    expect(drawImage).toBeCalledWith(
      sourceCanvas,
      0,
      0,
      400,
      200,
      0,
      0,
      200,
      100
    );
    expect(screenshot).toBe("data:image/png;base64");
  });

  test("narrower ratio", () => {
    const sourceCanvas = {
      width: 400,
      height: 400,
    } as HTMLCanvasElement;
    const screenshot = resizeScreenshot(sourceCanvas, targetCanvas, 200, 150);
    expect(drawImage).toBeCalledWith(
      sourceCanvas,
      0,
      0,
      400,
      400,
      0,
      0,
      150,
      150
    );
    expect(screenshot).toBe("data:image/png;base64");
  });
});
