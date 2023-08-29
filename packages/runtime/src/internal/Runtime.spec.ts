import { describe, test, expect, jest } from "@jest/globals";
import { createProviderClass } from "@next-core/utils/general";
import { loadBricksImperatively } from "@next-core/loader";
import type { BootstrapData } from "@next-core/types";
import {
  HttpResponseError as _HttpResponseError,
  HttpAbortError as _HttpAbortError,
} from "@next-core/http";
import {
  createRuntime as _createRuntime,
  getRuntime as _getRuntime,
  _internalApiGetRenderId as __internalApiGetRenderId,
} from "./Runtime.js";
import { loadNotificationService } from "../Notification.js";
import { loadDialogService } from "../Dialog.js";
import { getHistory as _getHistory } from "../history.js";

jest.mock("@next-core/loader");
jest.mock("../Dialog.js");
jest.mock("../Notification.js");

const consoleError = jest.spyOn(console, "error");
window.scrollTo = jest.fn();

const getBootstrapData = (options?: {
  templates?: boolean;
  settings?: boolean;
  locales?: boolean;
}): BootstrapData => ({
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
              ["incremental-sub-route-rendering"]: true,
            },
            misc: {
              staff: "cool",
            },
          },
        },
        locales: options?.locales
          ? {
              en: {
                name: "Application A",
              },
            }
          : undefined,
      },
      routes: [
        {
          path: "${APP.homepage}",
          exact: true,
          bricks: [
            {
              brick: "div",
              properties: {
                textContent: "<% `I'm homepage of ${APP.localeName}` %>",
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
          path: "${APP.homepage}/3",
          exact: true,
          bricks: [
            {
              brick: "div",
              portal: true,
              properties: {
                textContent: "I'm in portal",
              },
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
        {
          path: "${APP.homepage}/sub-routes/:sub",
          menu: {
            breadcrumb: { items: [{ text: "0" }] },
          },
          context: [{ name: "subParent" }],
          bricks: [
            {
              brick: "h1",
              properties: {
                textContent: "<% `Hello [${PATH.sub}]` %>",
              },
            },
            {
              brick: "div",
              slots: {
                "": {
                  type: "routes",
                  routes: [
                    {
                      path: "${APP.homepage}/sub-routes/1",
                      menu: {
                        breadcrumb: { items: [{ text: "1" }] },
                      },
                      context: [{ name: "subA" }],
                      bricks: [
                        {
                          brick: "p",
                          properties: {
                            textContent: "Sub 1",
                          },
                        },
                      ],
                    },
                    {
                      path: "${APP.homepage}/sub-routes/2",
                      menu: {
                        breadcrumb: { items: [{ text: "2" }] },
                      },
                      context: [{ name: "subA" }],
                      bricks: [
                        {
                          brick: "p",
                          properties: {
                            textContent: "Sub 2",
                          },
                        },
                      ],
                    },
                    {
                      path: "${APP.homepage}/sub-routes/3",
                      menu: {
                        breadcrumb: { items: [{ text: "3" }] },
                      },
                      bricks: [
                        {
                          brick: "p",
                          properties: {
                            textContent: "<% Sub 3 %>",
                          },
                        },
                      ],
                    },
                    {
                      path: "${APP.homepage}/sub-routes/4",
                      menu: {
                        breadcrumb: { items: [{ text: "4" }] },
                      },
                      type: "redirect",
                      redirect: "${APP.homepage}/sub-routes/2",
                    },
                    {
                      path: "${APP.homepage}/sub-routes/5",
                      menu: {
                        breadcrumb: { items: [{ text: "5" }], overwrite: true },
                      },
                      bricks: [
                        {
                          brick: "p",
                          properties: {
                            textContent: "Sub 5",
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
      meta: {
        customTemplates: options?.templates
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
    {
      app: {
        id: "app-b",
        homepage: "/app-b",
        name: "App B",
      },
      routes: [
        {
          path: "${APP.homepage}",
          exact: true,
          bricks: [],
        },
        {
          path: "${APP.homepage}/fail",
          exact: true,
          bricks: null!,
        },
        {
          path: "${APP.homepage}/unauthenticated",
          exact: true,
          context: [
            {
              name: "test",
              resolve: { useProvider: "my-unauthenticated-provider" },
            },
          ],
          bricks: [],
        },
        {
          path: "${APP.homepage}/aborted",
          exact: true,
          context: [
            {
              name: "test",
              resolve: { useProvider: "my-abort-provider" },
            },
          ],
          bricks: [],
        },
      ],
    },
    {
      app: {
        id: "auth",
        homepage: "/auth",
        name: "Auth",
      },
      routes: [],
    },
  ],
  brickPackages: [],
  settings: options?.settings
    ? {
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
        presetBricks: {
          notification: false,
          dialog: false,
        },
      }
    : undefined,
});

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

const myUnauthenticatedProvider = jest.fn<() => Promise<unknown>>();
customElements.define(
  "my-unauthenticated-provider",
  createProviderClass(myUnauthenticatedProvider)
);

const myAbortProvider = jest.fn<() => Promise<unknown>>();
customElements.define(
  "my-abort-provider",
  createProviderClass(myAbortProvider)
);

describe("Runtime", () => {
  let createRuntime: typeof _createRuntime;
  let getRuntime: typeof _getRuntime;
  let getHistory: typeof _getHistory;
  let _internalApiGetRenderId: typeof __internalApiGetRenderId;
  let HttpResponseError: typeof _HttpResponseError;
  let HttpAbortError: typeof _HttpAbortError;

  beforeEach(() => {
    window.NO_AUTH_GUARD = true;
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
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const p = require("@next-core/http");
      HttpResponseError = p.HttpResponseError;
      HttpAbortError = p.HttpAbortError;
      _internalApiGetRenderId = r._internalApiGetRenderId;
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("basic page", async () => {
    createRuntime().initialize(
      getBootstrapData({ settings: true, locales: true })
    );
    getHistory().push("/app-a");
    await getRuntime().bootstrap();
    expect(loadNotificationService).not.toBeCalled();
    expect(loadDialogService).not.toBeCalled();
    const renderId0 = _internalApiGetRenderId();
    expect(renderId0).toBeDefined();
    expect(document.body.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <div
          id="main-mount-point"
        >
          <div>
            I'm homepage of Application A
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
    expect(getRuntime().hasInstalledApp("app-b")).toBe(true);
    expect(getRuntime().getFeatureFlags()).toEqual({
      "incremental-sub-route-rendering": true,
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
    createRuntime().initialize(getBootstrapData({ templates: true }));

    expect(() => createRuntime()).toThrowErrorMatchingInlineSnapshot(
      `"Cannot create multiple runtimes"`
    );

    getHistory().push("/app-a/2");
    await getRuntime().bootstrap();

    expect(loadNotificationService).toBeCalledTimes(1);
    expect(loadDialogService).toBeCalledTimes(1);

    expect(document.body.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <div
          id="main-mount-point"
        >
          <app-a.tpl-a
            data-tpl-state-store-id="tpl-state-2"
          >
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

  test("single portal brick", async () => {
    createRuntime().initialize(getBootstrapData());

    getHistory().push("/app-a/3");
    await getRuntime().bootstrap();
    expect(document.body.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <div
          id="main-mount-point"
        />,
        <div
          id="portal-mount-point"
        >
          <div>
            I'm in portal
          </div>
        </div>,
      ]
    `);
  });

  test("incremental sub-router rendering", async () => {
    createRuntime().initialize(getBootstrapData());
    getHistory().push("/app-a/sub-routes/1");
    await getRuntime().bootstrap();
    await (global as any).flushPromises();
    expect(document.body.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <div
          id="main-mount-point"
        >
          <h1>
            Hello [1]
          </h1>
          <div>
            <p>
              Sub 1
            </p>
          </div>
        </div>,
        <div
          id="portal-mount-point"
        />,
      ]
    `);
    expect(getRuntime().getNavConfig()).toEqual({
      breadcrumb: [{ text: "0" }, { text: "1" }],
    });

    getHistory().push("/app-a/sub-routes/2");
    await (global as any).flushPromises();
    expect(document.body.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <div
          id="main-mount-point"
        >
          <h1>
            Hello [1]
          </h1>
          <div>
            <p>
              Sub 2
            </p>
          </div>
        </div>,
        <div
          id="portal-mount-point"
        />,
      ]
    `);
    expect(getRuntime().getNavConfig()).toEqual({
      breadcrumb: [{ text: "0" }, { text: "2" }],
    });

    consoleError.mockReturnValueOnce();
    getHistory().push("/app-a/sub-routes/3");
    await (global as any).flushPromises();
    expect(document.body.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <div
          id="main-mount-point"
        >
          <h1>
            Hello [1]
          </h1>
          <div>
            <div>
              SyntaxError: Unexpected token (1:4), in "&lt;% Sub 3 %&gt;"
            </div>
          </div>
        </div>,
        <div
          id="portal-mount-point"
        />,
      ]
    `);
    expect(consoleError).toBeCalledTimes(1);
    expect(getRuntime().getNavConfig()).toEqual({
      breadcrumb: [{ text: "0" }],
    });

    getHistory().push("/app-a/sub-routes/4");
    await (global as any).flushPromises();
    expect(document.body.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <div
          id="main-mount-point"
        >
          <h1>
            Hello [1]
          </h1>
          <div>
            <p>
              Sub 2
            </p>
          </div>
        </div>,
        <div
          id="portal-mount-point"
        />,
      ]
    `);
    expect(getRuntime().getNavConfig()).toEqual({
      breadcrumb: [{ text: "0" }, { text: "2" }],
    });

    getHistory().push("/app-a/sub-routes/5");
    await (global as any).flushPromises();
    expect(document.body.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <div
          id="main-mount-point"
        >
          <h1>
            Hello [1]
          </h1>
          <div>
            <p>
              Sub 5
            </p>
          </div>
        </div>,
        <div
          id="portal-mount-point"
        />,
      ]
    `);
    expect(getRuntime().getNavConfig()).toEqual({
      breadcrumb: [{ text: "5" }],
    });

    getHistory().push("/app-a/1");
    await (global as any).flushPromises();
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

    getHistory().push("/app-a/sub-routes/1");
    await (global as any).flushPromises();
    getHistory().push("/app-a/sub-routes/6");
    await (global as any).flushPromises();
    expect(document.body.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <div
          id="main-mount-point"
        >
          <h1>
            Hello [6]
          </h1>
          <div />
        </div>,
        <div
          id="portal-mount-point"
        />,
      ]
    `);
    expect(getRuntime().getNavConfig()).toEqual({
      breadcrumb: [{ text: "0" }],
    });
  });

  test("unauthenticated", async () => {
    window.NO_AUTH_GUARD = false;
    createRuntime({
      hooks: {
        auth: {
          isLoggedIn() {
            return false;
          },
          getAuth() {
            return {};
          },
        },
      },
    }).initialize(getBootstrapData());
    getHistory().push("/app-b/");
    await getRuntime().bootstrap();
    expect(getHistory().location.pathname).toBe("/auth/login");
  });

  test("no app matched", async () => {
    window.NO_AUTH_GUARD = false;
    createRuntime({
      hooks: {
        auth: {
          isLoggedIn() {
            return false;
          },
          getAuth() {
            return {};
          },
        },
      },
    }).initialize({
      storyboards: [
        {
          app: {
            id: "sso-auth",
            homepage: "/sso-auth",
            name: "SSO Auth",
          },
          routes: [],
        },
      ],
      brickPackages: [],
      settings: {
        featureFlags: {
          "sso-enabled": true,
        },
      },
    });
    getHistory().push("/app-unknown/");
    await getRuntime().bootstrap();
    expect(getHistory().location.pathname).toBe("/sso-auth/login");
  });

  test("failed", async () => {
    consoleError.mockReturnValueOnce();
    createRuntime().initialize(getBootstrapData());
    getHistory().push("/app-b/fail");
    await getRuntime().bootstrap();
    expect(consoleError).toBeCalledTimes(1);
    expect(document.body.children).toMatchInlineSnapshot(`
      HTMLCollection [
        <div
          id="main-mount-point"
        >
          <div>
            TypeError: Cannot read properties of null (reading 'map')
          </div>
        </div>,
        <div
          id="portal-mount-point"
        />,
      ]
    `);
  });

  test("API unauthenticated", async () => {
    consoleError.mockReturnValueOnce();
    const error = new HttpResponseError({ status: 401 } as any, {
      code: 100003,
    });
    myUnauthenticatedProvider.mockRejectedValueOnce(error);
    window.NO_AUTH_GUARD = false;
    createRuntime().initialize(getBootstrapData());
    getHistory().push("/app-b/unauthenticated");
    await getRuntime().bootstrap();
    expect(myUnauthenticatedProvider).toBeCalledTimes(1);
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith("Router failed:", error);
    expect(getHistory().location.pathname).toBe("/auth/login");
  });

  test("redirect to other login page  if not logged in", async () => {
    consoleError.mockReturnValueOnce();
    const error = new HttpResponseError({ status: 401 } as any, {
      code: 100003,
    });
    myUnauthenticatedProvider.mockRejectedValueOnce(error);
    window.STANDALONE_MICRO_APPS = true;
    window.NO_AUTH_GUARD = true;
    createRuntime().initialize(getBootstrapData());
    getHistory().push("/app-b/unauthenticated");
    await getRuntime().bootstrap();
    jest.spyOn(getRuntime(), "getMiscSettings").mockImplementation(() => {
      return { noAuthGuardLoginPath: "/easy-core-console/login" };
    });
    expect(myUnauthenticatedProvider).toBeCalledTimes(1);
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith("Router failed:", error);
    expect(getRuntime().getMiscSettings().noAuthGuardLoginPath).toBe(
      "/easy-core-console/login"
    );
  });

  test("API aborted", async () => {
    consoleError.mockReturnValueOnce();
    const error = new HttpAbortError("aborted");
    myAbortProvider.mockRejectedValueOnce(error);
    createRuntime().initialize(getBootstrapData());
    getHistory().push("/app-b/aborted");
    await getRuntime().bootstrap();
    expect(myAbortProvider).toBeCalledTimes(1);
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith("Router failed:", error);
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
  });

  test("page not found", async () => {
    createRuntime().initialize(getBootstrapData());
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
    createRuntime().initialize(getBootstrapData());
    getHistory().push("/app-a/r1");
    await getRuntime().bootstrap();
    await (global as any).flushPromises();
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

  test("loadBricks", async () => {
    const runtime = createRuntime();
    runtime.initialize({ brickPackages: [{ id: "bricks/test" } as any] });
    await runtime.loadBricks(["test.my-brick"]);
    expect(loadBricksImperatively).toBeCalledWith(
      ["test.my-brick"],
      [{ id: "bricks/test" }]
    );
  });

  test("initialize twice", () => {
    const runtime = createRuntime();
    runtime.initialize({});
    expect(() => {
      runtime.initialize({});
    }).toThrowErrorMatchingInlineSnapshot(
      `"The runtime cannot be initialized more than once"`
    );

    expect(getRuntime().getRecentApps()).toEqual({});
  });

  test("bootstrap twice", async () => {
    const runtime = createRuntime();
    await runtime.bootstrap({});
    expect(runtime.bootstrap()).rejects.toMatchInlineSnapshot(
      `[Error: The runtime cannot be bootstrapped more than once]`
    );
  });
});
