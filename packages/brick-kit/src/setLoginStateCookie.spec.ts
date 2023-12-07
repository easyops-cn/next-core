import { setLoginStateCookie } from "./setLoginStateCookie";
import type { PluginLocation } from "@next-core/brick-types";

describe("setLoginStateCookie", () => {
  it("should work", () => {
    const mockLocation = {
      search: "username=easyops",
      pathname: "/visual-builder/project/5fbe399d53abd/app/test/templates",
    };
    setLoginStateCookie(mockLocation as PluginLocation);
    expect(document.cookie).toBe(
      "SALOGINPATH=JTJGdmlzdWFsLWJ1aWxkZXIlMkZwcm9qZWN0JTJGNWZiZTM5OWQ1M2FiZCUyRmFwcCUyRnRlc3QlMkZ0ZW1wbGF0ZXM=; SALOGINQUERY=dXNlcm5hbWUlM0RlYXN5b3Bz"
    );

    setLoginStateCookie({ search: "", pathname: "" } as PluginLocation);
    expect(document.cookie).toEqual("SALOGINPATH=; SALOGINQUERY=");
  });
});
