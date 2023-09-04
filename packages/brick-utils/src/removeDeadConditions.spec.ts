import type {
  BrickConf,
  ContextConf,
  CustomTemplate,
  CustomTemplateConstructor,
  RuntimeStoryboard,
} from "@next-core/brick-types";
import {
  removeDeadConditions,
  removeDeadConditionsInTpl,
} from "./removeDeadConditions";

type MaybeArray<T> = T | T[];

describe("removeDeadConditions", () => {
  it.each<[MaybeArray<Partial<BrickConf>>, MaybeArray<Partial<BrickConf>>]>([
    [{ brick: "a" }, { brick: "a" }],
    [{ brick: "a", if: false }, null],
    [
      { brick: "a", if: '<% FLAGS["enabled"] %>' },
      { brick: "a", if: true },
    ],
    [{ brick: "a", if: '<% !FLAGS["enabled"] %>' }, null],
    [
      // Logical expressions
      [
        { brick: "a", if: '<% FLAGS["disabled"] || CTX.any %>' },
        { brick: "b", if: "<% FLAGS.disabled && CTX.any %>" },
        { brick: "c", if: '<% CTX.any && !FLAGS["enabled"] %>' },
        { brick: "d", if: "<% !(FLAGS.enabled || CTX.any) %>" },
        { brick: "e", if: "<% !(CTX.any || !null) %>" },
        { brick: "f", if: "<% 0 && CTX.any %>" },
        { brick: "g", if: "<% !(CTX.any || !undefined) %>" },
        { brick: "h", if: "<% undefined && CTX.any %>" },
        { brick: "i", if: "<% HASH && CTX.any %>" },
        { brick: "j", if: "<% !HASH && CTX.any %>" },
        { brick: "k", if: "<% FLAGS[disabled] && CTX.any %>" },
      ],
      [
        { brick: "a", if: '<% FLAGS["disabled"] || CTX.any %>' },
        { brick: "i", if: "<% HASH && CTX.any %>" },
        { brick: "j", if: "<% !HASH && CTX.any %>" },
        { brick: "k", if: "<% FLAGS[disabled] && CTX.any %>" },
      ],
    ],
    [
      // Multiple items.
      [
        { brick: "a", if: false },
        { brick: "b", if: '<% FLAGS["enabled"] %>' },
      ],
      [{ brick: "b", if: true }],
    ],
    [
      // Slots
      {
        brick: "a",
        slots: {
          b: {
            type: "bricks",
            bricks: [
              {
                brick: "c",
                if: '<% FLAGS["disabled"] %>',
              },
            ],
          },
          d: {
            type: "routes",
            routes: [
              {
                path: "/d",
                if: '<% FLAGS["disabled"] %>',
                bricks: [],
              },
            ],
          },
        },
      },
      {
        brick: "a",
        slots: {
          b: {
            type: "bricks",
            bricks: [],
          },
          d: {
            type: "routes",
            routes: [],
          },
        },
      },
    ],
    [
      // Events
      {
        brick: "a",
        events: {
          click: {
            useProvider: "c",
            if: '<% FLAGS["disabled"] %>',
          },
          dblclick: [
            {
              useProvider: "d",
              if: '<% FLAGS["enabled"] %>',
              callback: {
                success: {
                  action: "console.log",
                  if: '<% FLAGS["disabled"] %>',
                },
              },
            },
            {
              useProvider: "e",
              if: '<% FLAGS["disabled"] %>',
            },
          ],
          contextmenu: {
            useProvider: "f",
            callback: {
              success: {
                action: "console.log",
                if: '<% FLAGS["enabled"] %>',
              },
            },
          },
          keydown: {
            if: "<% false && CTX.abc %>",
            then: {
              action: "console.log",
            },
            else: {
              action: "console.info",
            },
          },
          keyup: {
            if: "<% true || CTX.abc %>",
            then: {
              action: "console.log",
            },
            else: {
              action: "console.info",
            },
          },
          oops: null,
        },
      },
      {
        brick: "a",
        events: {
          dblclick: [
            {
              useProvider: "d",
              if: true,
              callback: {},
            },
          ],
          contextmenu: {
            useProvider: "f",
            callback: {
              success: {
                action: "console.log",
                if: true,
              },
            },
          },
          keydown: {
            then: {
              action: "console.info",
            },
          },
          keyup: {
            if: true,
            then: {
              action: "console.log",
            },
          },
          oops: null,
        },
      },
    ],
    [
      // LifeCycle
      {
        brick: "a",
        lifeCycle: {
          useResolves: [
            {
              useProvider: "b",
              if: '<% FLAGS["enabled"] %>',
            },
            {
              useProvider: "c",
              if: '<% FLAGS["disabled"] %>',
            },
          ],
          onPageLoad: [
            {
              action: "console.log",
              if: '<% FLAGS["disabled"] %>',
            },
            {
              action: "console.warn",
              if: '<% FLAGS["enabled"] %>',
            },
          ],
          onPageLeave: {
            action: "console.log",
            if: '<% FLAGS["disabled"] %>',
          },
          onMessage: [
            {
              channel: "any",
              handlers: [
                {
                  action: "console.log",
                  if: '<% FLAGS["disabled"] %>',
                },
                {
                  action: "console.warn",
                  if: '<% FLAGS["enabled"] %>',
                },
              ],
            },
          ],
        },
      },
      {
        brick: "a",
        lifeCycle: {
          useResolves: [
            {
              useProvider: "b",
              if: true,
            },
          ],
          onPageLoad: [
            {
              action: "console.warn",
              if: true,
            },
          ],
          onMessage: [
            {
              channel: "any",
              handlers: [
                {
                  action: "console.warn",
                  if: true,
                },
              ],
            },
          ],
        },
      },
    ],
    [
      // UseBrick
      {
        brick: "a",
        properties: {
          useBrick: [
            {
              brick: "b",
              properties: {
                b1: [
                  {
                    useBrick: {
                      brick: "c",
                      if: true,
                    },
                  },
                ],
                b2: {
                  useBrick: {
                    brick: "d",
                    if: '<% FLAGS["disabled"] %>',
                  },
                },
              },
            },
            {
              brick: "e",
              if: '<% FLAGS["enabled"] %>',
              slots: {
                e1: {
                  bricks: [
                    { brick: "f" },
                    { brick: "g", if: '<% FLAGS["disabled"] %>' },
                  ],
                },
              },
            },
            {
              brick: "e",
              if: '<% FLAGS["disabled"] %>',
            },
          ],
        },
      },
      {
        brick: "a",
        properties: {
          useBrick: [
            {
              brick: "b",
              properties: {
                b1: [
                  {
                    useBrick: {
                      brick: "c",
                      if: true,
                    },
                  },
                ],
                b2: {
                  useBrick: {
                    brick: "div",
                    if: false,
                  },
                },
              },
            },
            {
              brick: "e",
              if: true,
              slots: {
                e1: {
                  bricks: [{ brick: "f" }],
                },
              },
            },
          ],
        },
      },
    ],
  ])("should work for bricks: %j", (input, output) => {
    const storyboard = {
      routes: [{ bricks: [].concat(input) }],
    } as RuntimeStoryboard;

    removeDeadConditions(storyboard, {
      constantFeatureFlags: true,
      featureFlags: {
        enabled: true,
      },
    });

    expect(storyboard).toEqual({
      $$deadConditionsRemoved: true,
      routes: [{ bricks: [].concat(output).filter(Boolean) }],
    });
  });

  it.each<[Partial<BrickConf>, Partial<BrickConf>]>([
    [{ brick: "a", if: "<% false %>" }, null],
    [
      { brick: "a", if: '<% FLAGS["unknown"] %>' },
      { brick: "a", if: '<% FLAGS["unknown"] %>' },
    ],
  ])("should work for bricks", (input, output) => {
    const storyboard = {
      routes: [{ bricks: [input] }],
    } as RuntimeStoryboard;

    removeDeadConditions(storyboard);

    expect(storyboard).toEqual({
      $$deadConditionsRemoved: true,
      routes: [{ bricks: [output].filter(Boolean) }],
    });
  });

  it.each<[Partial<ContextConf>, Partial<ContextConf>]>([
    [{ name: "a", if: false }, null],
    [
      { name: "a", if: "<% CTX.any %>" },
      { name: "a", if: "<% CTX.any %>" },
    ],
  ])("should work for context", (input, output) => {
    const storyboard = {
      routes: [{ context: [input] }],
    } as RuntimeStoryboard;

    removeDeadConditions(storyboard);

    expect(storyboard).toEqual({
      $$deadConditionsRemoved: true,
      routes: [{ context: [output].filter(Boolean) }],
    });
  });

  it("should work for routes", () => {
    const storyboard = {
      routes: [
        {
          type: "routes",
          routes: [
            {
              bricks: [{ brick: "a" }],
              if: '<% FLAGS["disabled"] %>',
            },
            {
              bricks: [{ brick: "b" }],
              if: '<% FLAGS["enabled"] %>',
            },
          ],
        },
        {
          type: "bricks",
          if: '<% FLAGS["disabled"] %>',
          bricks: [
            {
              brick: "a",
            },
          ],
        },
      ],
    } as RuntimeStoryboard;

    removeDeadConditions(storyboard, {
      constantFeatureFlags: true,
      featureFlags: {
        enabled: true,
      },
    });

    expect(storyboard).toEqual({
      $$deadConditionsRemoved: true,
      routes: [
        {
          type: "routes",
          routes: [
            {
              bricks: [{ brick: "b" }],
              if: true,
            },
          ],
        },
      ],
    });

    // Do nothing when do it again.
    removeDeadConditions(storyboard);
  });

  it("should work for custom templates", () => {
    const tplConstructor = {
      name: "tpl-test",
      bricks: [
        { brick: "a", if: '<% FLAGS["disabled"] %>' },
        { brick: "b", if: '<% FLAGS["enabled"] %>' },
      ],
      proxy: {},
    } as CustomTemplate;

    const storyboard = {
      meta: {
        customTemplates: [tplConstructor],
      },
    } as RuntimeStoryboard;

    removeDeadConditions(storyboard, {
      constantFeatureFlags: true,
      featureFlags: {
        enabled: true,
      },
    });

    expect(tplConstructor).toEqual({
      name: "tpl-test",
      bricks: [{ brick: "b", if: true }],
      proxy: {},
    });
  });

  it("should work for custom templates", () => {
    const tplConstructor = {
      bricks: [{ brick: "a", if: false }],
      state: [{ name: "b", if: "<% false %>" }],
    } as CustomTemplateConstructor;

    removeDeadConditionsInTpl(tplConstructor);

    expect(tplConstructor).toEqual({
      bricks: [],
      state: [],
    });
  });

  it("should warn for potential dead if", () => {
    const tplConstructor = {
      bricks: [{ brick: "a", if: null }],
    } as CustomTemplateConstructor;

    const consoleWarn = jest.spyOn(console, "warn").mockImplementation();
    removeDeadConditionsInTpl(tplConstructor);
    expect(consoleWarn).toBeCalledTimes(1);
    expect(consoleWarn).toBeCalledWith(
      "[potential dead if]:",
      "object",
      null,
      expect.anything()
    );

    expect(tplConstructor).toEqual({
      bricks: [{ brick: "a", if: null }],
    });
  });
});
