import {
  haveBeenInjected,
  rememberInjected,
  resetAllInjected
} from "./injected";

describe("injected", () => {
  it("should work", () => {
    const object = {};
    expect(haveBeenInjected(object)).toBe(false);
    rememberInjected(object);
    expect(haveBeenInjected(object)).toBe(true);
    resetAllInjected();
    expect(haveBeenInjected(object)).toBe(false);
  });
});
