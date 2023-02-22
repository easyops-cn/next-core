import { setImmediate as flushMicroTasks } from "node:timers";
import { jest } from "@jest/globals";

(global as any).IS_REACT_ACT_ENVIRONMENT = true;

// Ref https://github.com/facebook/jest/issues/2157#issuecomment-279171856
(global as any).flushPromises = () =>
  new Promise((resolve) => {
    // Ref https://github.com/facebook/jest/issues/2157#issuecomment-649557561
    flushMicroTasks(resolve);
  });

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}
