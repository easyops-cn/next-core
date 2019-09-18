import { computeRealRoutePath } from "./computeRealRoutePath";

describe("computeRealRoutePath", () => {
  const app = {
    homepage: "/auth"
  } as any;
  it.each<any>([
    ["/auth", "/auth"],
    ["${APP.homepage}/login", "/auth/login"],
    [["${APP.homepage}/logout"], ["/auth/logout"]]
  ])("computeRealRoutePath(%s) should return %s", (path, realPath) => {
    expect(computeRealRoutePath(path, app)).toEqual(realPath);
  });
});
