import {
  getMedia,
  mediaEventTarget,
  mediaSizeBreakpointMap,
} from "./mediaQuery";

const matchMediaMockResults = (window.matchMedia as jest.Mock).mock.results;
const offset = matchMediaMockResults.length - mediaSizeBreakpointMap.size;

describe("mediaQuery", () => {
  it("should work", () => {
    const handler = jest.fn();
    expect(getMedia()).toEqual({ size: "xLarge" });
    mediaEventTarget.addEventListener("change", handler);
    const mediaSizes = [...mediaSizeBreakpointMap.keys()];
    mediaSizes.forEach((size, index) => {
      const nextSize = mediaSizes[index + 1];

      if (nextSize) {
        (
          matchMediaMockResults[index + offset].value
            .addEventListener as jest.Mock
        ).mock.calls[0][1]({
          matches: false,
        });
        const newMedia = { size: nextSize };
        expect(getMedia()).toEqual(newMedia);
        expect(handler).lastCalledWith(
          expect.objectContaining({
            detail: newMedia,
          })
        );
      }
    });
  });
});
