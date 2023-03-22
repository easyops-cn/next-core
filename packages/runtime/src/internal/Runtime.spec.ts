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
    expect(document.body).toMatchInlineSnapshot(`
      <body>
        <div
          id="main-mount-point"
        >
          <div>
            I'm homepage of App A
          </div>
        </div>
        <div
          id="portal-mount-point"
        />
      </body>
    `);

    // Go to a redirect page
    getHistory().push("/app-a/0");
    await (global as any).flushPromises();

    const renderId1 = _internalApiGetRenderId();
    expect(renderId1).not.toEqual(renderId0);

    // It's redirected
    expect(getHistory().location.pathname).toBe("/app-a/1");
    expect(document.body).toMatchInlineSnapshot(`
      <body>
        <div
          id="main-mount-point"
        >
          <div>
            I'm page 1 of App A
          </div>
        </div>
        <div
          id="portal-mount-point"
        />
      </body>
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
    expect(document.body).toMatchInlineSnapshot(`
      <body>
        <div
          id="main-mount-point"
        >
          <div>
            I'm page 1 of App A
          </div>
        </div>
        <div
          id="portal-mount-point"
        />
      </body>
    `);
  });

  test("tpl", async () => {
    returnTemplates = true;
    createRuntime();
    getHistory().push("/app-a/2");
    await getRuntime().bootstrap();
    expect(document.body).toMatchInlineSnapshot(`
      <body>
        <div
          id="main-mount-point"
        >
          <app-a.tpl-a>
            <div>
              I'm Resolved X
            </div>
          </app-a.tpl-a>
        </div>
        <div
          id="portal-mount-point"
        />
      </body>
    `);
  });

  test("page not found", async () => {
    createRuntime();
    getHistory().push("/not-found");
    await getRuntime().bootstrap();
    expect(document.body).toMatchInlineSnapshot(`
      <body>
        <div
          id="main-mount-point"
        >
          <div>
            Page not found
          </div>
        </div>
        <div
          id="portal-mount-point"
        />
      </body>
    `);
  });
});
