import { describe, test, expect } from "@jest/globals";
import { createProviderClass } from "./createProviderClass.js";
import { unwrapProvider } from "./unwrapProvider.js";

function sayHello(to: string, ending: string) {
  return `Hello, ${to}${ending}`;
}
customElements.define("test-provider", createProviderClass(sayHello));

describe("unwrapProvider", () => {
  test("general", () => {
    const provider = "test-provider";
    const result1 = unwrapProvider(provider)("world", "!");
    expect(result1).toEqual("Hello, world!");
    const result2 = unwrapProvider(provider)("others", ".");
    expect(result2).toEqual("Hello, others.");
  });
});
