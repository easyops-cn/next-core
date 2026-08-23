import type {
  BrickConf,
  BrickEventsMap,
  CustomTemplate,
  MenuConf,
  RouteConfOfBricks,
  Storyboard,
} from "@next-core/types";
import {
  parseBrick,
  parseEvents,
  parseMenu,
  parseMetaMenus,
  parseStoryboard,
  parseTemplates,
} from "./parser.js";
import type { MenuRawData } from "./interfaces.js";

describe("parser", () => {
  it("should parse an empty storyboard", () => {
    const storyboard = {} as unknown as Storyboard;

    const result = parseStoryboard(storyboard);

    expect(result).toEqual({
      type: "Root",
      raw: storyboard,
      routes: [],
      templates: [],
      menus: [],
    });
  });

  it("should parse storyboard with routes", () => {
    const storyboard = {
      routes: [
        {
          type: "bricks",
          path: "/home",
          context: [],
          bricks: [
            {
              brick: "button",
              lifeCycle: {
                onPageLoad: {
                  action: "message.success",
                  args: ["Loaded"],
                },
                // Legacy useResolves will be ignored by default
                useResolves: [
                  {
                    useProvider: "my-legacy-use-resolve",
                  },
                ],
                onMessage: {
                  handlers: {
                    action: "console.log",
                  },
                },
              },
            },
          ],
          providers: [
            "my-legacy-provider",
            {
              brick: "my-legacy-provider-2",
            },
          ],
          defineResolves: [
            {
              useProvider: "my-legacy-define-resolve",
            },
          ],
          // Legacy redirect of non-redirect route will be ignored by default
          redirect: {
            useProvider: "my-legacy-redirect",
            args: ["/any"],
          },
        },
        {
          redirect: {
            useProvider: "my-redirect-provider",
          },
        },
        {
          type: "redirect",
          redirect: "/home",
        },
        {
          type: "routes",
        },
      ],
    } as unknown as Storyboard;
    const firstRoute = storyboard.routes[0] as RouteConfOfBricks;
    const firstBrick = firstRoute.bricks[0];

    const result = parseStoryboard(storyboard);

    expect(result).toEqual({
      menus: [],
      raw: storyboard,
      routes: [
        {
          children: [
            {
              children: [],
              context: undefined,
              events: undefined,
              isUseBrick: undefined,
              lifeCycle: [
                {
                  handlers: [
                    {
                      callback: undefined,
                      else: [],
                      raw: {
                        action: "message.success",
                        args: ["Loaded"],
                      },
                      rawKey: undefined,
                      then: [],
                      type: "EventHandler",
                    },
                  ],
                  name: "onPageLoad",
                  rawContainer: firstBrick.lifeCycle,
                  rawKey: "onPageLoad",
                  type: "SimpleLifeCycle",
                },
                {
                  rawContainer: firstBrick.lifeCycle,
                  rawKey: "useResolves",
                  type: "UnknownLifeCycle",
                },
                {
                  events: [
                    {
                      handlers: [
                        {
                          callback: undefined,
                          else: [],
                          raw: {
                            action: "console.log",
                          },
                          rawKey: undefined,
                          then: [],
                          type: "EventHandler",
                        },
                      ],
                      rawContainer: {
                        handlers: { action: "console.log" },
                      },
                      rawKey: "handlers",
                      type: "ConditionalEvent",
                    },
                  ],
                  name: "onMessage",
                  type: "ConditionalLifeCycle",
                },
              ],
              raw: firstBrick,
              type: "Brick",
              useBackend: [],
              useBrick: [],
            },
          ],
          context: [],
          defineResolves: undefined,
          menu: undefined,
          providers: undefined,
          raw: firstRoute,
          redirect: undefined,
          type: "Route",
        },
        {
          children: [],
          raw: storyboard.routes[1],
          redirect: undefined,
          type: "Route",
        },
        {
          children: [],
          raw: storyboard.routes[2],
          redirect: undefined,
          type: "Route",
        },
        {
          children: [],
          raw: storyboard.routes[3],
          redirect: undefined,
          type: "Route",
        },
      ],
      templates: [],
      type: "Root",
    });

    const legacyResult = parseStoryboard(storyboard, { legacy: true });

    expect(legacyResult).toEqual({
      menus: [],
      raw: storyboard,
      routes: [
        {
          children: [
            {
              children: [],
              context: undefined,
              events: undefined,
              isUseBrick: undefined,
              lifeCycle: [
                {
                  handlers: [
                    {
                      callback: undefined,
                      else: [],
                      raw: {
                        action: "message.success",
                        args: ["Loaded"],
                      },
                      rawKey: undefined,
                      then: [],
                      type: "EventHandler",
                    },
                  ],
                  name: "onPageLoad",
                  rawContainer: firstBrick.lifeCycle,
                  rawKey: "onPageLoad",
                  type: "SimpleLifeCycle",
                },
                {
                  rawContainer: firstBrick.lifeCycle,
                  rawKey: "useResolves",
                  resolves: [
                    {
                      isConditional: true,
                      raw: {
                        useProvider: "my-legacy-use-resolve",
                      },
                      type: "Resolvable",
                    },
                  ],
                  type: "ResolveLifeCycle",
                },
                expect.objectContaining({
                  type: "ConditionalLifeCycle",
                }),
              ],
              raw: firstBrick,
              type: "Brick",
              useBackend: [],
              useBrick: [],
            },
          ],
          context: [],
          defineResolves: [
            {
              isConditional: undefined,
              raw: {
                useProvider: "my-legacy-define-resolve",
              },
              type: "Resolvable",
            },
          ],
          providers: [
            expect.objectContaining({
              raw: {
                brick: "my-legacy-provider",
              },
              type: "Brick",
            }),
            expect.objectContaining({
              raw: {
                brick: "my-legacy-provider-2",
              },
              type: "Brick",
            }),
          ],
          raw: firstRoute,
          redirect: {
            isConditional: undefined,
            raw: {
              useProvider: "my-legacy-redirect",
              args: ["/any"],
            },
            type: "Resolvable",
          },
          type: "Route",
        },
        {
          children: [],
          raw: storyboard.routes[1],
          redirect: {
            isConditional: undefined,
            raw: {
              useProvider: "my-redirect-provider",
            },
            type: "Resolvable",
          },
          type: "Route",
        },
        {
          children: [],
          raw: storyboard.routes[2],
          redirect: undefined,
          type: "Route",
        },
        {
          children: [],
          raw: storyboard.routes[3],
          redirect: undefined,
          type: "Route",
        },
      ],
      templates: [],
      type: "Root",
    });
  });

  it("should parse useBrick and useBackend", () => {
    const brick: BrickConf = {
      brick: "my-brick",
      if: {
        useProvider: "my-condition",
      },
      properties: {
        title: "My Brick",
        array: [1],
        help: {
          useBrick: {
            brick: "my-inner-brick-1",
            children: [
              {
                brick: "my-inner-brick-2",
              },
            ],
          },
        },
        service: {
          useBackend: {
            provider: "my-backend-provider",
          },
        },
      },
      slots: {
        "": {
          type: "routes",
          routes: [],
        },
      },
    };
    const result = parseBrick(brick);
    expect(result).toEqual({
      children: [
        {
          children: [],
          childrenType: "Route",
          raw: {
            routes: [],
            type: "routes",
          },
          slot: "",
          type: "Slot",
        },
      ],
      context: undefined,
      events: undefined,
      if: {
        resolve: {
          isConditional: undefined,
          raw: {
            useProvider: "my-condition",
          },
          type: "Resolvable",
        },
        type: "ResolvableCondition",
      },
      isUseBrick: undefined,
      lifeCycle: undefined,
      raw: brick,
      type: "Brick",
      useBackend: [
        {
          children: [
            expect.objectContaining({
              raw: {
                brick: "my-backend-provider",
              },
              type: "Brick",
            }),
          ],
          rawContainer: {
            useBackend: {
              provider: "my-backend-provider",
            },
          },
          rawKey: "useBackend",
          type: "UseBackendEntry",
        },
      ],
      useBrick: [
        {
          children: [
            {
              children: [
                {
                  children: [
                    {
                      children: [],
                      context: undefined,
                      events: undefined,
                      isUseBrick: true,
                      lifeCycle: undefined,
                      raw: {
                        brick: "my-inner-brick-2",
                      },
                      type: "Brick",
                      useBackend: [],
                      useBrick: [],
                    },
                  ],
                  childrenType: "Brick",
                  raw: {
                    bricks: [
                      {
                        brick: "my-inner-brick-2",
                      },
                    ],
                    type: "bricks",
                  },
                  slot: "",
                  type: "Slot",
                },
              ],
              context: undefined,
              events: undefined,
              isUseBrick: true,
              lifeCycle: undefined,
              raw: (brick.properties!.help as { useBrick: unknown }).useBrick,
              type: "Brick",
              useBackend: [],
              useBrick: [],
            },
          ],
          rawContainer: brick.properties!.help,
          rawKey: "useBrick",
          type: "UseBrickEntry",
        },
      ],
    });
  });

  it("should parse events", () => {
    const events: BrickEventsMap = {
      click: {
        target: "#my-brick",
        method: "resolve",
        callback: {
          success: [
            {
              action: "message.success",
            },
          ],
        },
      },
    };
    const result = parseEvents(events);
    expect(result).toEqual([
      {
        handlers: [
          {
            callback: [
              {
                handlers: [
                  {
                    callback: undefined,
                    else: [],
                    raw: {
                      action: "message.success",
                    },
                    rawKey: 0,
                    then: [],
                    type: "EventHandler",
                  },
                ],
                rawContainer: {
                  success: [
                    {
                      action: "message.success",
                    },
                  ],
                },
                rawKey: "success",
                type: "EventCallback",
              },
            ],
            else: [],
            raw: events.click,
            rawKey: undefined,
            then: [],
            type: "EventHandler",
          },
        ],
        rawContainer: events,
        rawKey: "click",
        type: "Event",
      },
    ]);
  });

  it("should parse custom templates", () => {
    const customTemplates: CustomTemplate[] = [
      {
        name: "tpl-test",
        bricks: [{ if: true, brick: "div" }],
        state: [
          {
            name: "test",
            value: "any",
          },
          {
            name: "resolveValue",
            resolve: {
              useProvider: "my-resolve",
            },
            onChange: {
              action: "message.success",
            },
          },
        ],
      },
    ];

    const result = parseTemplates(customTemplates);

    expect(result).toEqual([
      {
        bricks: [
          {
            children: [],
            context: undefined,
            events: undefined,
            if: {
              type: "LiteralCondition",
            },
            isUseBrick: undefined,
            lifeCycle: undefined,
            raw: {
              brick: "div",
              if: true,
            },
            type: "Brick",
            useBackend: [],
            useBrick: [],
          },
        ],
        context: [
          {
            onChange: [],
            raw: {
              name: "test",
              value: "any",
            },
            resolve: undefined,
            type: "Context",
          },
          {
            onChange: [
              {
                callback: undefined,
                else: [],
                raw: {
                  action: "message.success",
                },
                rawKey: undefined,
                then: [],
                type: "EventHandler",
              },
            ],
            raw: customTemplates[0].state![1],
            resolve: {
              isConditional: undefined,
              raw: {
                useProvider: "my-resolve",
              },
              type: "Resolvable",
            },
            type: "Context",
          },
        ],
        raw: customTemplates[0],
        type: "Template",
      },
    ]);
  });

  it("should parse menu", () => {
    expect(parseMenu(false)).toEqual({ type: "FalseMenu" });
    expect(parseMenu(undefined)).toEqual(undefined);
    expect(parseMenu({ menuId: "my-menu" })).toEqual({ type: "StaticMenu" });

    expect(
      parseMenu({
        type: "resolve",
        resolve: { useProvider: "my-menu-resolve" },
      })
    ).toEqual({
      resolve: {
        isConditional: undefined,
        raw: {
          useProvider: "my-menu-resolve",
        },
        type: "Resolvable",
      },
      type: "ResolvableMenu",
    });

    // Legacy brick menu is ignored by default.
    expect(
      parseMenu({
        type: "brick",
        brick: "my-legacy-menu",
      } as unknown as MenuConf)
    ).toEqual(undefined);
    // Unless `options.legacy` is set to true
    expect(
      parseMenu(
        { type: "brick", brick: "my-legacy-menu" } as unknown as MenuConf,
        { legacy: true }
      )
    ).toEqual({
      type: "BrickMenu",
      brick: expect.objectContaining({
        raw: {
          brick: "my-legacy-menu",
          type: "brick",
        },
        type: "Brick",
      }),
      raw: {
        brick: "my-legacy-menu",
        type: "brick",
      },
    });
  });

  it("should parse meta.menus", () => {
    const menus = [
      {
        title: "A",
        items: [
          {
            title: "A-1",
            children: [
              {
                title: "A-1-1",
                children: [],
              },
            ],
          },
        ],
      },
      { title: "B" },
    ] as unknown as MenuRawData[];

    const result = parseMetaMenus(menus);

    expect(result).toEqual([
      {
        items: [
          {
            children: [
              {
                children: [],
                raw: {
                  children: [],
                  title: "A-1-1",
                },
                type: "MetaMenuItem",
              },
            ],
            raw: menus[0].items![0],
            type: "MetaMenuItem",
          },
        ],
        raw: menus[0],
        type: "MetaMenu",
      },
      {
        items: [],
        raw: {
          title: "B",
        },
        type: "MetaMenu",
      },
    ]);
  });
});
