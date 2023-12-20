import { setAppVariable } from "./setAppVariable.js";

describe("replaceAppVariable", () => {
  beforeEach(() => {
    delete window.APP_ROOT_TPL;
    delete window.APP_ROOT;
  });
  it("should work", () => {
    setAppVariable({ appId: "visual-builder", version: "1.0.0" });

    expect(window.APP_ROOT).toEqual(undefined);

    window.APP_ROOT_TPL = "sa-static/{id}/versions/{version}/webroot/";

    setAppVariable({ appId: "visual-builder", version: "1.0.0" });

    expect(window.APP_ROOT).toEqual(
      "sa-static/visual-builder/versions/1.0.0/webroot/"
    );
  });
});
