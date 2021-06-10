import { Location } from "history";
import {
  RuntimeStoryboard,
  ResolveConf,
  Storyboard,
} from "@next-core/brick-types";
import { LocationContext, MountRoutesResult } from "./LocationContext";
import { Kernel } from "./Kernel";
import { isLoggedIn, getAuth } from "../auth";
import * as history from "../history";
import * as runtime from "../core/Runtime";
import * as md from "./MessageDispatcher";
import { applyTheme } from "../themeAndMode";
import { ResolveRequestError } from "./Resolver";
import { validatePermissions } from "./checkPermissions";

jest.mock("../auth");
jest.mock("./MessageDispatcher");
jest.mock("../themeAndMode");
jest.mock("./checkPermissions");
const consoleLog = jest.spyOn(console, "log").mockImplementation(() => void 0);
const consoleInfo = jest
  .spyOn(console, "info")
  .mockImplementation(() => void 0);
jest.spyOn(console, "warn").mockImplementation(() => void 0);
jest.spyOn(console, "error").mockImplementation(() => void 0);
jest.spyOn(md, "getMessageDispatcher").mockImplementation(
  () =>
    ({
      create: jest.fn(),
    } as any)
);
const spyOnIsLoggedIn = isLoggedIn as jest.Mock;
(getAuth as jest.Mock).mockReturnValue({
  username: "easyops",
  userInstanceId: "acbd46b",
});

jest.spyOn(history, "getHistory").mockReturnValue({
  location: {
    hash: "",
  },
} as any);

const spyOnGetCurrentContext = jest.spyOn(
  runtime,
  "_internalApiGetCurrentContext"
);

describe("LocationContext", () => {
  const kernel: Kernel = {
    mountPoints: {
      main: {},
      bg: document.createElement("div"),
      portal: {},
    },
    bootstrapData: {
      storyboards: [],
      brickPackages: [
        {
          filePath: "all.js",
        },
      ],
    },
    unsetBars: jest.fn(),
    menuBar: {
      element: {},
    },
    appBar: {
      element: {
        breadcrumb: [],
      },
    },
    toggleBars: jest.fn(),
    getFeatureFlags: jest.fn().mockReturnValue({
      testing: true,
    }),
  } as any;

  const getInitialMountResult = (): MountRoutesResult => ({
    main: [],
    menuInBg: [],
    portal: [],
    menuBar: {},
    appBar: {
      breadcrumb: kernel.appBar.element.breadcrumb,
    },
    flags: {
      redirect: undefined,
    },
  });

  afterEach(() => {
    spyOnIsLoggedIn.mockReset();
    jest.clearAllMocks();
  });

  describe("matchStoryboard", () => {
    const storyboards: RuntimeStoryboard[] = [
      {
        app: {
          id: "hello",
          name: "Hello",
          homepage: "/hello",
        },
        routes: [
          {
            path: "/hello",
            public: true,
            bricks: [],
          },
        ],
      },
      {
        app: {
          id: "hello-world",
          name: "Hello World",
          homepage: "/hello/world",
        },
        routes: [
          {
            path: "/hello/world",
            public: true,
            bricks: [],
          },
        ],
      },
      {
        app: {
          id: "oops",
          name: "OOPS",
          // Legacy storyboard with no homepage.
          homepage: null,
        },
      },
    ];

    it("should handle match missed", () => {
      const context = new LocationContext(kernel, {
        pathname: "/",
        search: "",
        hash: "",
        state: {},
      });
      const storyboard = context.matchStoryboard(storyboards);
      expect(storyboard).toBe(undefined);
    });

    it("should handle match hit", () => {
      const context = new LocationContext(kernel, {
        pathname: "/hello",
        search: "",
        hash: "",
        state: {},
      });
      const storyboard = context.matchStoryboard(storyboards);
      expect(storyboard.app.id).toBe("hello");
    });

    it("should handle match hit sub-path", () => {
      const context = new LocationContext(kernel, {
        pathname: "/hello/everyone",
        search: "",
        hash: "",
        state: {},
      });
      const storyboard = context.matchStoryboard(storyboards);
      expect(storyboard.app.id).toBe("hello");
    });

    it("should handle match more precisely", () => {
      const context = new LocationContext(kernel, {
        pathname: "/hello/world",
        search: "",
        hash: "",
        state: {},
      });
      const storyboard = context.matchStoryboard(storyboards);
      expect(storyboard.app.id).toBe("hello-world");
    });
  });

  describe("mountRoutes", () => {
    it("should mount nothing if match missed", async () => {
      const context = new LocationContext(kernel, {
        pathname: "/hello",
        search: "",
        hash: "",
        state: {},
      });
      const result = await context.mountRoutes(
        [],
        undefined,
        getInitialMountResult()
      );
      expect(result).toMatchObject({
        main: [],
        menuBar: {},
        appBar: {},
        flags: {
          redirect: undefined,
        },
      });
    });

    it("should redirect if not logged in", async () => {
      const location = {
        pathname: "/",
        search: "",
        hash: "",
        state: {},
      };
      const context = new LocationContext(kernel, location);
      spyOnIsLoggedIn.mockReturnValueOnce(false);
      const result = await context.mountRoutes(
        [
          {
            path: "/",
            bricks: [],
          },
        ],
        undefined,
        getInitialMountResult()
      );
      expect(result).toMatchObject({
        main: [],
        menuBar: {},
        appBar: {},
        flags: {
          unauthenticated: true,
          redirect: undefined,
        },
      });
    });

    it("should redirect if match redirected", async () => {
      const context = new LocationContext(kernel, {
        pathname: "/hello",
        search: "",
        hash: "",
        state: {},
      });
      spyOnIsLoggedIn.mockReturnValue(true);
      const result = await context.mountRoutes(
        [
          {
            path: "/hello",
            redirect: "/oops",
          },
        ],
        undefined,
        getInitialMountResult()
      );
      expect(result).toMatchObject({
        main: [],
        menuBar: {},
        appBar: {},
        flags: {
          redirect: {
            path: "/oops",
          },
        },
      });
    });

    it("should validate permissions when permissionsPreCheck has been defined", async () => {
      const context = new LocationContext(kernel, {
        pathname: "/",
        search: "",
        hash: "",
        state: {},
      });
      spyOnIsLoggedIn.mockReturnValue(true);
      spyOnGetCurrentContext.mockReturnValueOnce(context.getCurrentContext());
      await context.mountRoutes(
        [
          {
            path: "/",
            permissionsPreCheck: ["<% CTX.instanceUpdateAction %>"],
            bricks: [],
            context: [
              {
                name: "instanceUpdateAction",
                value: "cmdb_HOST_instance_update",
              },
            ],
          },
        ],
        undefined,
        getInitialMountResult()
      );
      expect(validatePermissions).toHaveBeenCalledWith([
        "cmdb_HOST_instance_update",
      ]);
    });

    it("should ignore validating permissions if not logged in", async () => {
      const context = new LocationContext(kernel, {
        pathname: "/",
        search: "",
        hash: "",
        state: {},
      });
      spyOnIsLoggedIn.mockReturnValue(false);
      await context.mountRoutes(
        [
          {
            path: "/",
            permissionsPreCheck: ["<% CTX.instanceUpdateAction %>"],
            bricks: [],
          },
        ],
        undefined,
        getInitialMountResult()
      );
      expect(validatePermissions).not.toBeCalled();
    });

    it("should mount if match hit", async () => {
      const context = new LocationContext(kernel, {
        pathname: "/",
        search: "",
        hash: "",
        state: {},
      });
      spyOnIsLoggedIn.mockReturnValue(true);

      spyOnGetCurrentContext.mockReturnValue(context.getCurrentContext());

      jest
        .spyOn(context.resolver, "resolveOne")
        .mockImplementationOnce(
          async (
            type: any,
            resolveConf: ResolveConf,
            conf: Record<string, any>
          ) => {
            Object.assign(conf, resolveConf.transform);
          }
        );

      jest
        .spyOn(context.resolver, "resolve")
        .mockImplementation((brickConf) => {
          if (brickConf.lifeCycle?.useResolves?.length > 0) {
            return Promise.reject(new ResolveRequestError("Invalid request"));
          }
          return Promise.resolve();
        });

      const result = await context.mountRoutes(
        [
          {
            path: "/",
            providers: [
              "provider-a",
              {
                brick: "provider-b",
                properties: {
                  args: ["good"],
                },
              },
            ],
            context: [
              {
                name: "myFreeContext",
                value: "bad",
                if: "<% FLAGS['should-not-enabled'] %>",
              },
              {
                name: "myFreeContext",
                value: "good",
                if: "<% !FLAGS['should-not-enabled'] %>",
              },
              {
                name: "myAsyncContext",
                resolve: {
                  provider: "provider-c",
                  transform: {
                    value: "even better",
                  },
                },
              },
              {
                name: "myAsyncContext",
                resolve: {
                  provider: "provider-d",
                  transform: {
                    value: "turns worse",
                  },
                  if: "<% CTX.myFreeContext === 'bad' %>",
                },
              },
            ],
            type: "routes",
            routes: [
              {
                path: "/",
                bricks: [
                  {
                    if: "${FLAGS.testing}",
                    brick: "div",
                    properties: {
                      title:
                        "<% `${CTX.myFreeContext} ${CTX.myAsyncContext}` %>",
                    },
                    context: [
                      {
                        name: "myNewPropContext",
                        property: "title",
                      },
                      {
                        name: "myFreeContextDefinedOnBrick",
                        value: "some value",
                      },
                    ],
                    exports: {
                      title: "CTX.myPropContext",
                    },
                    events: {
                      click: {
                        action: "history.push",
                      },
                    },
                    lifeCycle: {
                      onBeforePageLoad: {
                        action: "theme.setDarkTheme",
                      },
                      onPageLoad: {
                        action: "console.log",
                      },
                      onBeforePageLeave: {
                        action: "console.log",
                      },
                      onPageLeave: {
                        action: "console.log",
                      },
                      onAnchorLoad: {
                        action: "console.log",
                      },
                      onAnchorUnload: {
                        action: "console.log",
                      },
                      onMessageClose: {
                        action: "console.log",
                      },
                    },
                    slots: {
                      menu: {
                        type: "bricks",
                        bricks: [
                          {
                            brick: "p",
                          },
                        ],
                      },
                      content: {
                        type: "routes",
                        routes: [
                          {
                            path: "/",
                            bricks: [],
                            menu: {
                              sidebarMenu: {
                                title: "menu title",
                                menuItems: [],
                              },
                              pageTitle: "page title",
                              breadcrumb: {
                                items: [
                                  {
                                    text: "first breadcrumb",
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      },
                      extendA: {
                        type: "routes",
                        routes: [
                          {
                            path: "/",
                            bricks: [],
                            menu: {
                              type: "brick",
                              brick: "a",
                            },
                          },
                        ],
                      },
                      extendB: {
                        type: "routes",
                        routes: [
                          {
                            path: "/",
                            bricks: [],
                            menu: {
                              type: "brick",
                              brick: "b",
                              events: {},
                              lifeCycle: {
                                onPageLoad: {
                                  action: "console.info",
                                },
                                onBeforePageLeave: {
                                  action: "console.info",
                                },
                                onPageLeave: {
                                  action: "console.info",
                                },
                                onAnchorLoad: {
                                  action: "console.info",
                                  args: ["${EVENT.detail.anchor}"],
                                },
                                onAnchorUnload: {
                                  action: "console.info",
                                },
                                onMessageClose: {
                                  action: "console.info",
                                },
                              },
                            },
                          },
                        ],
                      },
                      extendC: {
                        type: "routes",
                        routes: [
                          {
                            path: "/",
                            bricks: [],
                            menu: {
                              breadcrumb: {
                                overwrite: true,
                                items: [
                                  {
                                    text: "second breadcrumb",
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      },
                      extendD: {
                        type: "routes",
                        routes: [
                          {
                            path: "/",
                            bricks: [],
                            menu: false,
                          },
                        ],
                      },
                      extendE: {
                        type: "routes",
                        routes: [
                          {
                            path: "/",
                            bricks: [],
                            menu: {},
                          },
                        ],
                      },
                      extendF: {
                        type: "invalid",
                        routes: [],
                      },
                      extendG: {
                        type: "routes",
                        routes: [
                          {
                            path: "/",
                            bricks: [
                              {
                                brick: "modal-a",
                                portal: true,
                                properties: {
                                  args: ["a"],
                                },
                                slots: {
                                  content: {
                                    type: "bricks",
                                    bricks: [
                                      {
                                        brick: "h2",
                                        properties: {
                                          textContent: "modal heading",
                                        },
                                      },
                                      {
                                        brick: "p",
                                        portal: true,
                                        properties: {
                                          textContent: "portal in portal",
                                        },
                                      },
                                    ],
                                  },
                                },
                              },
                            ],
                            menu: {},
                          },
                        ],
                      },
                    },
                  },
                  {
                    if: "${FLAGS.testing|not}",
                    brick: "div",
                  },
                  {
                    brick: "brick-will-fail",
                    lifeCycle: {
                      useResolves: [
                        {
                          useProvider: "provider-will-reject",
                        },
                      ],
                    },
                  },
                  {
                    template: "template-will-fail",
                    lifeCycle: {
                      useResolves: [
                        {
                          useProvider: "provider-will-reject",
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ] as any,
        undefined,
        getInitialMountResult()
      );
      expect(result).toMatchObject({
        menuBar: {
          menu: {
            title: "menu title",
            menuItems: [],
          },
        },
        appBar: {
          pageTitle: "page title",
          breadcrumb: [
            {
              text: "second breadcrumb",
            },
          ],
        },
        flags: {
          barsHidden: true,
          redirect: undefined,
        },
      });
      expect(result.main).toMatchObject([
        {
          type: "div",
          properties: {
            title: "good even better",
          },
          events: {
            click: {
              action: "history.push",
            },
          },
          children: [
            {
              type: "p",
              slotId: "menu",
            },
          ],
        },
        {
          type: "basic-bricks.brick-error",
          properties: {
            brickName: "brick-will-fail",
            errorType: "ResolveRequestError",
            errorMessage: "Invalid request",
            isLegacyTemplate: false,
          },
        },
        {
          type: "basic-bricks.brick-error",
          properties: {
            brickName: "template-will-fail",
            errorType: "ResolveRequestError",
            errorMessage: "Invalid request",
            isLegacyTemplate: true,
          },
        },
      ]);
      const brick = result.main[0];
      expect(
        brick.context.storyboardContext.get("myFreeContextDefinedOnBrick").brick
      ).toBe(brick);
      expect(kernel.mountPoints.bg.children.length).toBe(2);
      expect(kernel.mountPoints.bg.children[0].tagName).toBe("PROVIDER-A");
      expect(kernel.mountPoints.bg.children[1].tagName).toBe("PROVIDER-B");
      expect((kernel.mountPoints.bg.children[1] as any).args).toEqual(["good"]);

      expect(result.portal).toMatchObject([
        {
          type: "modal-a",
          properties: {
            args: ["a"],
          },
          children: [
            {
              type: "h2",
              properties: {
                textContent: "modal heading",
              },
              children: [],
              slotId: "content",
            },
          ],
          slotId: undefined,
        },
        {
          type: "p",
          properties: {
            textContent: "portal in portal",
          },
          children: [],
          slotId: undefined,
        },
      ]);

      context.handleBeforePageLoad();
      expect(applyTheme).toBeCalledWith("dark");
      context.handlePageLoad();
      context.handleAnchorLoad();
      (history.getHistory as jest.Mock).mockReturnValue({
        location: {
          hash: "#yes",
        },
      });
      context.handleAnchorLoad();
      context.handleBeforePageLeave({
        location: { pathname: "/home" } as Location,
        action: "POP",
      });
      context.handlePageLeave();
      context.handleMessageClose(new CloseEvent("error"));
      context.handleMessage();

      // Assert `console.log()`.
      expect(consoleLog).toHaveBeenNthCalledWith(
        1,
        new CustomEvent("page.load")
      );
      expect(consoleLog).toHaveBeenNthCalledWith(
        2,
        new CustomEvent("anchor.unload")
      );
      expect(consoleLog).toHaveBeenNthCalledWith(
        3,
        new CustomEvent("anchor.load", {
          detail: {
            hash: "#yes",
            anchor: "yes",
          },
        })
      );
      expect(consoleLog).toHaveBeenNthCalledWith(
        4,
        new CustomEvent("page.beforeLeave", {
          detail: {
            location: { pathname: "/home" },
            action: "POP",
          },
        })
      );
      expect(consoleLog).toHaveBeenNthCalledWith(
        5,
        new CustomEvent("page.leave")
      );

      expect(consoleLog).toHaveBeenNthCalledWith(
        6,
        new CustomEvent("message.close")
      );

      // Assert `console.info()`.
      expect(consoleInfo).toHaveBeenNthCalledWith(
        1,
        new CustomEvent("page.load")
      );
      expect(consoleInfo).toHaveBeenNthCalledWith(
        2,
        new CustomEvent("anchor.unload")
      );
      expect(consoleInfo).toHaveBeenNthCalledWith(3, "yes");
      expect(consoleInfo).toHaveBeenNthCalledWith(
        4,
        new CustomEvent("page.beforeLeave", {
          detail: {
            location: { pathname: "/home" },
            action: "POP",
          },
        })
      );
      expect(consoleInfo).toHaveBeenNthCalledWith(
        5,
        new CustomEvent("page.leave")
      );
      expect(consoleInfo).toHaveBeenNthCalledWith(
        6,
        new CustomEvent("message.close")
      );
    });

    it("resolve menu should work", async () => {
      const context = new LocationContext(kernel, {
        pathname: "/",
        search: "",
        hash: "",
        state: {},
      });
      spyOnIsLoggedIn.mockReturnValue(true);
      jest
        .spyOn(context.resolver, "resolveOne")
        .mockImplementationOnce(
          (type: any, resolveConf: ResolveConf, conf: Record<string, any>) => {
            Object.assign(conf, resolveConf.transform);
            return Promise.resolve();
          }
        );
      const resolveConf = {
        provider: "provider-a",
        transform: {
          pageTitle: "A",
          sidebarMenu: {
            title: "title-a",
            menuItems: [
              {
                text: "item-1",
              },
            ],
          },
        },
      };

      const result = await context.mountRoutes(
        [
          {
            path: "/",
            providers: [
              "provider-a",
              {
                brick: "provider-b",
                properties: {
                  args: ["good"],
                },
              },
            ],
            menu: {
              type: "resolve",
              resolve: resolveConf,
            },
            bricks: [],
          },
        ],
        undefined,
        getInitialMountResult()
      );

      expect(result.menuBar).toMatchObject({
        menu: {
          title: "title-a",
          menuItems: [
            {
              text: "item-1",
            },
          ],
        },
      });
    });
  });

  it("getSubStoryboardByRoute should work", () => {
    const context = new LocationContext(kernel, {
      pathname: "/1/2",
      search: "",
      hash: "",
      state: {},
    });
    const storyboard = {
      app: {
        id: "a",
        homepage: "/1",
      },
      routes: [
        {
          path: "${APP.homepage}/2",
          bricks: null,
        },
        {
          path: "${APP.homepage}/3",
          bricks: null,
        },
      ],
    } as Partial<Storyboard>;
    spyOnIsLoggedIn.mockReturnValue(true);
    expect(context.getSubStoryboardByRoute(storyboard as Storyboard)).toEqual({
      app: {
        id: "a",
        homepage: "/1",
      },
      routes: [
        {
          path: "${APP.homepage}/2",
          bricks: null,
        },
      ],
    });
  });
});
