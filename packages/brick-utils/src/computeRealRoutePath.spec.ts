import { computeRealRoutePath } from "./computeRealRoutePath";

describe("computeRealRoutePath", () => {
  const app = {
    homepage: "/auth"
  } as any;
  it.each<[string | string[], string | string[]]>([
    ["/auth", "/auth"],
    ["${APP.homepage}/login", "/auth/login"],
    [["${APP.homepage}/logout"], ["/auth/logout"]],
    [null, undefined]
  ])("computeRealRoutePath(%s) should return %s", (path, realPath) => {
    expect(computeRealRoutePath(path, app)).toEqual(realPath);
  });
});
