import { describe, test, expect } from "@jest/globals";
import { createProviderClass } from "./createProviderClass.js";

describe("createProviderClass", () => {
  test("basic", () => {
    function myProvider() {
      return "good";
    }
    customElements.define("my-brick", createProviderClass(myProvider));
    const myBrick = document.createElement("my-brick") as unknown as {
      $$typeof: string;
      resolve: typeof myProvider;
    };
    expect(myBrick.resolve()).toBe("good");
    expect(myBrick.$$typeof).toBe("provider");
  });
});
