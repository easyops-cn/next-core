import "whatwg-fetch";
import { HttpResponseError } from "@easyops/brick-http";
import { isUnauthenticatedError } from "./isUnauthenticatedError";

describe("isUnauthenticatedError", () => {
  it.each<[any, boolean]>([
    [{}, false],
    [new HttpResponseError(new Response("", { status: 403 })), false],
    [new HttpResponseError(new Response("", { status: 401 })), false],
    [
      new HttpResponseError(new Response("", { status: 401 }), {
        code: 100003
      }),
      true
    ]
  ])("isUnauthenticatedError(%j) should return %s", (error, result) => {
    expect(isUnauthenticatedError(error)).toBe(result);
  });
});
