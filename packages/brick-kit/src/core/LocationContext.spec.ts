import { PluginLocation, RuntimeStoryboard } from "@easyops/brick-types";
import * as brickUtils from "@easyops/brick-utils";
import { LocationContext, MountRoutesResult } from "./LocationContext";
import { Kernel } from "./Kernel";
import { isLoggedIn, getAuth } from "../auth";

jest.mock("../auth");

const spyOnMatchPath = jest.spyOn(brickUtils, "matchPath");
const spyOnIsLoggedIn = isLoggedIn as jest.Mock;
(getAuth as jest.Mock).mockReturnValue({
  username: "easyops"
});

(global as any).customElements = {
  get: () => true
};

describe("LocationContext", () => {
  let context: LocationContext;
  const kernel: Kernel = {
    mountPoints: {
      main: {},
      bg: document.createElement("div")
    },
    bootstrapData: {
      storyboards: [],
      brickPackages: [
        {
          filePath: "all.js"
        }
      ]
    },
    unsetBars: jest.fn(),
    menuBar: {
      element: {}
    },
    appBar: {
      element: {
        breadcrumb: []
      }
    },
    toggleBars: jest.fn()
  } as any;

  const location: PluginLocation = {
    pathname: "/",
    search: "",
    hash: "",
    state: {}
  };

  const getInitialMountResult = (): MountRoutesResult => ({
    main: [],
    menuInBg: [],
    menuBar: {
      app: kernel.nextApp
    },
    appBar: {
      app: kernel.nextApp,
      breadcrumb: kernel.appBar.element.breadcrumb
    },
    flags: {
      redirect: undefined
    }
  });

  beforeEach(() => {
    context = new LocationContext(kernel, location);
  });

  afterEach(() => {
    spyOnMatchPath.mockReset();
    spyOnIsLoggedIn.mockReset();
  });

  describe("matchStoryboard", () => {
    const storyboards: RuntimeStoryboard[] = [
      {
        routes: [
          {
            path: "",
            public: true,
            bricks: []
          }
        ]
      }
    ];

    it("should handle match missed", () => {
      spyOnMatchPath.mockReturnValueOnce(null);
      const storyboard = context.matchStoryboard(storyboards);
      expect(storyboard).toBe(undefined);
    });

    it("should handle match hit", () => {
      spyOnMatchPath.mockReturnValueOnce({} as any);
      const storyboard = context.matchStoryboard(storyboards);
      expect(storyboard).toBe(storyboards[0]);
    });
  });

  describe("mountRoutes", () => {
    it("should mount nothing if match missed", async () => {
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
          redirect: undefined
        }
      });
    });

    it("should redirect if not logged in", async () => {
      spyOnMatchPath.mockReturnValueOnce({} as any);
      spyOnIsLoggedIn.mockReturnValueOnce(false);
      const result = await context.mountRoutes(
        [
          {
            path: "/",
            bricks: []
          }
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
            path: "/auth/login",
            state: {
              from: location
            }
          }
        }
      });
    });

    it("should redirect if match redirected", async () => {
      spyOnMatchPath.mockReturnValueOnce({} as any);
      spyOnIsLoggedIn.mockReturnValue(true);
      const result = await context.mountRoutes(
        [
          {
            path: "/",
            redirect: "/oops"
          }
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
            path: "/oops"
          }
        }
      });
    });

    it("should mount if match hit", async () => {
      spyOnMatchPath.mockReturnValue({} as any);
      spyOnIsLoggedIn.mockReturnValue(true);
      const result = await context.mountRoutes(
        [
          {
            path: "/",
            providers: [
              "provider-a",
              {
                brick: "provider-b",
                properties: {
                  args: ["good"]
                }
              }
            ],
            type: "routes",
            routes: [
              {
                path: "/",
                bricks: [
                  {
                    brick: "div",
                    properties: {
                      title: "good"
                    },
                    events: {
                      click: {
                        action: "history.push"
                      }
                    },
                    lifeCycle: {
                      onPageLoad: {
                        action: "console.log"
                      }
                    },
                    slots: {
                      menu: {
                        type: "bricks",
                        bricks: [
                          {
                            brick: "p"
                          }
                        ]
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
                                menuItems: []
                              },
                              pageTitle: "page title",
                              breadcrumb: {
                                items: [
                                  {
                                    text: "first breadcrumb"
                                  }
                                ]
                              }
                            }
                          }
                        ]
                      },
                      extendA: {
                        type: "routes",
                        routes: [
                          {
                            path: "/",
                            bricks: [],
                            menu: {
                              type: "brick",
                              brick: "a"
                            }
                          }
                        ]
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
                              events: {}
                            }
                          }
                        ]
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
                                    text: "second breadcrumb"
                                  }
                                ]
                              }
                            }
                          }
                        ]
                      },
                      extendD: {
                        type: "routes",
                        routes: [
                          {
                            path: "/",
                            bricks: [],
                            menu: false
                          }
                        ]
                      },
                      extendE: {
                        type: "routes",
                        routes: [
                          {
                            path: "/",
                            bricks: [],
                            menu: {}
                          }
                        ]
                      },
                      extendF: {
                        type: "invalid",
                        routes: []
                      }
                    }
                  }
                ]
              }
            ]
          }
        ] as any,
        undefined,
        getInitialMountResult()
      );
      expect(result).toMatchObject({
        menuBar: {
          menu: {
            title: "menu title",
            menuItems: []
          }
        },
        appBar: {
          pageTitle: "page title",
          breadcrumb: [
            {
              text: "second breadcrumb"
            }
          ]
        },
        flags: {
          barsHidden: true,
          redirect: undefined
        }
      });
      expect(result.main).toMatchObject([
        {
          type: "div",
          properties: {
            title: "good",
            match: {}
          },
          events: {
            click: {
              action: "history.push"
            }
          },
          children: [
            {
              type: "p",
              slotId: "menu"
            }
          ]
        }
      ]);
      expect(kernel.mountPoints.bg.children.length).toBe(2);
      expect(kernel.mountPoints.bg.children[0].tagName).toBe("PROVIDER-A");
      expect(kernel.mountPoints.bg.children[1].tagName).toBe("PROVIDER-B");
      expect((kernel.mountPoints.bg.children[1] as any).args).toEqual(["good"]);
      const consoleLog = jest.spyOn(console, "log");
      context.handlePageLoad();
      expect(consoleLog.mock.calls[0][0].type).toBe("page.load");
      consoleLog.mockRestore();
    });
  });
});
