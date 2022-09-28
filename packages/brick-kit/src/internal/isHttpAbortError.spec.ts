import { HttpAbortError } from "@next-core/brick-http";
import { isHttpAbortError } from "./isHttpAbortError";

describe("isHttpAbortError", () => {
  it("should work!", () => {
    const error = new HttpAbortError("The user aborted a request.");

    expect(isHttpAbortError(error)).toBe(true);
  });
});
