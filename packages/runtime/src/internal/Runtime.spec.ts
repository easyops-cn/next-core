import { describe, test, expect, jest } from "@jest/globals";
import { createProviderClass } from "@next-core/utils/storyboard";
import {
  createRuntime as _createRuntime,
  getRuntime as _getRuntime,
  _internalApiGetRenderId as __internalApiGetRenderId,
} from "./Runtime.js";
import { getHistory as _getHistory } from "../history.js";
import { loadBootstrapData } from "./loadBootstrapData.js";

jest.mock("./loadBootstrapData.js");

const consoleError = jest.spyOn(console, "error");
window.scrollTo = jest.fn();

let returnTemplates = false;
(loadBootstrapData as jest.Mock<typeof loadBootstrapData>).mockImplementation(
  async () => ({
    storyboards: [
      {
        app: {
          id: "app-a",
          homepage: "/app-a",
          name: "App A",
          noAuthGuard: true,
          config: {
            settings: {
              featureFlags: {
                ["some-app-feature"]: true,
              },
              misc: {
                staff: "cool",
              },
            },
          },
        },
        routes: [
          {
            path: "${APP.homepage}",
            exact: true,
            bricks: [
              {
                brick: "div",
                properties: {
                  textContent: "I'm homepage of App A",
                },
              },
            ],
            menu: {
              breadcrumb: {
                items: [{ text: "Home" }],
              },
            },
          },
          {
            path: "${APP.homepage}/0",
            type: "redirect",
            exact: true,
            redirect: "${APP.homepage}/1",
          },
          {
            path: "${APP.homepage}/1",
            exact: true,
            bricks: [
              {
                brick: "div",
                properties: {
                  textContent: "I'm page 1 of App A",
                },
              },
            ],
          },
          {
            path: "${APP.homepage}/2",
            exact: true,
            bricks: [
              {
                brick: "tpl-a",
              },
            ],
          },
          {
            path: "${APP.homepage}/r1",
            type: "redirect",
            exact: true,
            redirect: "${APP.homepage}/r2",
          },
          {
            path: "${APP.homepage}/r2",
            type: "redirect",
            exact: true,
            redirect: "${APP.homepage}/r1",
          },
        ],
        meta: {
          customTemplates: returnTemplates
            ? [
                {
                  name: "tpl-a",
                  state: [
                    {
                      name: "x",
                      resolve: {
                        useProvider: "my-timeout-provider",
                        args: [1, "Resolved X"],
                      },
                    },
                  ],
                  bricks: [
                    {
                      brick: "div",
                      properties: {
                        textContent: "<% `I'm ${STATE.x}` %>",
                      },
                    },
                  ],
                },
              ]
            : [],
        },
      },
    ],
    brickPackages: [],
    settings: {
      featureFlags: {
        ["some-global-feature"]: true,
      },
      misc: {
        quality: "good",
      },
      brand: {
        favicon: "new-favicon.png",
      },
      launchpad: {
        columns: 11,
        rows: 3,
      },
    },
  })
);

const myTimeoutProvider = jest.fn(
  (timeout: number, result: unknown) =>
    new Promise((resolve) => {
      setTimeout(() => resolve(result), timeout);
    })
);
customElements.define(
  "my-timeout-provider",
  createProviderClass(myTimeoutProvider)
);

describe("Runtime", () => {
  let createRuntime: typeof _createRuntime;
  let getRuntime: typeof _getRuntime;
  let getHistory: typeof _getHistory;
  let _internalApiGetRenderId: typeof __internalApiGetRenderId;

  beforeEach(() => {
    window.NO_AUTH_GUARD = true;
    returnTemplates = false;

    const main = document.createElement("div");
    main.id = "main-mount-point";
    const portal = document.createElement("div");
    portal.id = "portal-mount-point";
    document.body.append(main, portal);

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const h = require("../history.js");
      getHistory = h.getHistory;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const r = require("./Runtime.js");
      createRuntime = r.createRuntime;
      getRuntime = r.getRuntime;
      _internalApiGetRenderId = r._internalApiGetRenderId;
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("basic page", async () => {
    createRuntime();
    getHistory().push("/app-a");
    await getRuntime().bootstrap();
    const renderId0 = _internalApiGetRenderId();
    expect(renderId0).toBeDefined();
    expect(document.body.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <div
          id="main-mount-point"
        >
          <div>
            I'm homepage of App A
          </div>
        </div>,
        <div
          id="portal-mount-point"
        />,
      ]
    `);

    expect(getRuntime().getRecentApps()).toEqual({
      currentApp: expect.objectContaining({ id: "app-a" }),
      previousApp: undefined,
    });
    expect(getRuntime().getCurrentApp()).toMatchObject({ id: "app-a" });
    expect(getRuntime().getFeatureFlags()).toEqual({
      "migrate-to-brick-next-v3": true,
      "some-app-feature": true,
      "some-global-feature": true,
    });
    expect(getRuntime().getMiscSettings()).toEqual({
      quality: "good",
      staff: "cool",
    });
    expect(getRuntime().getBrandSettings()).toEqual({
      base_title: "DevOps 管理专家",
      favicon: "new-favicon.png",
    });
    expect(getRuntime().getLaunchpadSettings()).toEqual({
      columns: 11,
      rows: 3,
    });
    expect(getRuntime().getDesktops()).toEqual([]);
    expect(getRuntime().getLaunchpadSiteMap()).toEqual([]);
    expect(getRuntime().getNavConfig()).toEqual({
      breadcrumb: [{ text: "Home" }],
    });

    expect(document.body.classList.contains("launchpad-open")).toBe(false);
    getRuntime().toggleLaunchpadEffect(true);
    expect(document.body.classList.contains("launchpad-open")).toBe(true);
    getRuntime().toggleLaunchpadEffect(false);
    expect(document.body.classList.contains("launchpad-open")).toBe(false);

    expect(document.title).toBe("");
    getRuntime().applyPageTitle("Hello");
    expect(document.title).toBe("Hello - DevOps 管理专家");
    getRuntime().applyPageTitle("");
    expect(document.title).toBe("DevOps 管理专家");

    // Go to a redirect page
    getHistory().push("/app-a/0");
    await (global as any).flushPromises();

    const renderId1 = _internalApiGetRenderId();
    expect(renderId1).not.toEqual(renderId0);

    // It's redirected
    expect(getHistory().location.pathname).toBe("/app-a/1");
    expect(document.body.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <div
          id="main-mount-point"
        >
          <div>
            I'm page 1 of App A
          </div>
        </div>,
        <div
          id="portal-mount-point"
        />,
      ]
    `);

    // No notify
    getHistory().replaceQuery({ q: 1 }, { notify: false });
    expect(getHistory().location).toMatchObject({
      pathname: "/app-a/1",
      search: "?q=1",
    });
    await (global as any).flushPromises();
    const renderId2 = _internalApiGetRenderId();
    expect(renderId2).toEqual(renderId1);
    expect(document.body.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <div
          id="main-mount-point"
        >
          <div>
            I'm page 1 of App A
          </div>
        </div>,
        <div
          id="portal-mount-point"
        />,
      ]
    `);
  });

  test("tpl", async () => {
    returnTemplates = true;
    createRuntime();

    expect(() => createRuntime()).toThrowErrorMatchingInlineSnapshot(
      `"Cannot create multiple runtimes"`
    );

    getHistory().push("/app-a/2");
    await getRuntime().bootstrap();
    expect(document.body.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <div
          id="main-mount-point"
        >
          <app-a.tpl-a>
            <div>
              I'm Resolved X
            </div>
          </app-a.tpl-a>
        </div>,
        <div
          id="portal-mount-point"
        />,
      ]
    `);
  });

  test("page not found", async () => {
    createRuntime();
    getHistory().push("/not-found");
    await getRuntime().bootstrap();
    expect(document.body.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <div
          id="main-mount-point"
        >
          <div>
            Page not found
          </div>
        </div>,
        <div
          id="portal-mount-point"
        />,
      ]
    `);
  });

  test("infinite redirect", async () => {
    consoleError.mockReturnValueOnce();
    createRuntime();
    getHistory().push("/app-a/r1");
    await getRuntime().bootstrap();
    expect(document.body.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <div
          id="main-mount-point"
        />,
        <div
          id="portal-mount-point"
        />,
      ]
    `);
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith(
      'Infinite redirect detected: from "/app-a/r2" to "/app-a/r1"'
    );
    expect(getHistory().location.pathname).toBe("/app-a/r2");
  });
});
