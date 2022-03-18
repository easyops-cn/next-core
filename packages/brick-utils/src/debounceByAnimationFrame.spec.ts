import { debounceByAnimationFrame } from "./debounceByAnimationFrame";

window.requestAnimationFrame = jest.fn((fn) => setTimeout(fn, 100));
window.cancelAnimationFrame = jest.fn((frame) => clearTimeout(frame));

describe("debounceByAnimationFrame", () => {
  it("should work", () => {
    const fn = jest.fn();
    const debounced = debounceByAnimationFrame(fn);
    debounced("hello", "world");
    jest.advanceTimersByTime(60);
    debounced("hello", "new world");
    jest.advanceTimersByTime(60);
    expect(fn).not.toBeCalled();
    jest.advanceTimersByTime(100);
    expect(fn).toBeCalledTimes(1);
    expect(fn).toHaveBeenNthCalledWith(1, "hello", "new world");
  });
});
