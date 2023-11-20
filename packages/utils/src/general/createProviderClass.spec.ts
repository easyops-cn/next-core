import { describe, test, expect } from "@jest/globals";
import { createProviderClass } from "./createProviderClass.js";
import { saveAs } from "file-saver";

jest.mock("file-saver");

describe("createProviderClass", () => {
  test("basic", async () => {
    const mockSaveAs = saveAs as jest.Mock;
    function myProvider() {
      return "good";
    }
    customElements.define("my-brick", createProviderClass(myProvider));
    const myBrick = document.createElement("my-brick") as unknown as {
      $$typeof: string;
      resolve: typeof myProvider;
      saveAs: typeof mockSaveAs;
    };
    expect(myBrick.resolve()).toBe("good");
    expect(myBrick.$$typeof).toBe("provider");

    await myBrick.saveAs("test.txt");
    expect(mockSaveAs.mock.calls[0][1]).toEqual("test.txt");
  });
});
