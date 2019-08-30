import { PluginLocation, RuntimeStoryboard } from "@easyops/brick-types";
import * as brickUtils from "@easyops/brick-utils";
import { LocationContext } from "./LocationContext";
import { Kernel } from "./Kernel";
import { isLoggedIn } from "../auth";

jest.mock("../auth");

const spyOnMatchPath = jest.spyOn(brickUtils, "matchPath");
const spyOnIsLoggedIn = isLoggedIn as jest.Mock;

describe("LocationContext", () => {
  let context: LocationContext;
  const kernel: Kernel = {
    mountPoints: {
      main: {}
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
        ],
        deps: [],
        dll: []
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
    it("should mount nothing if match missed", () => {
      const result = context.mountRoutes([]);
      expect(result).toMatchObject({
        main: [],
        bg: [],
        menuBar: {},
        appBar: {},
        redirect: undefined
      });
    });

    it("should redirect if match redirected", () => {
      spyOnMatchPath.mockReturnValueOnce({} as any);
      spyOnIsLoggedIn.mockReturnValueOnce(false);
      const result = context.mountRoutes([
        {
          path: "/",
          bricks: []
        }
      ]);
      expect(result).toMatchObject({
        main: [],
        bg: [],
        menuBar: {},
        appBar: {},
        redirect: {
          path: "/auth/login",
          state: {
            from: location
          }
        }
      });
    });

    it("should mount if match hit", () => {
      spyOnMatchPath.mockReturnValue({} as any);
      spyOnIsLoggedIn.mockReturnValue(true);
      const result = context.mountRoutes([
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
      ] as any);
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
        redirect: undefined
        // barsHidden: true
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
      expect(result.bg).toMatchObject([
        {
          type: "a"
        },
        {
          type: "b"
        }
      ]);
    });
  });
});
