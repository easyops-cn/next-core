import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import { act } from "react-dom/test-utils";

configure({ adapter: new Adapter() });

// Ref https://github.com/facebook/jest/issues/2157#issuecomment-279171856
(global as any).flushPromises = () =>
  act(() => new Promise((resolve) => setImmediate(resolve)));

Element.prototype.scrollIntoView = jest.fn();
document.execCommand = jest.fn(() => true);

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
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
