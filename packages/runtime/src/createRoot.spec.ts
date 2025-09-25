import { i18n, initializeI18n } from "@next-core/i18n";
import { unstable_createRoot } from "./createRoot.js";
import { applyTheme } from "./themeAndMode.js";

initializeI18n();
jest.mock("./themeAndMode.js");
window.scrollTo = jest.fn();

class MyBrick extends HTMLElement {
  useBrick: unknown;
}
customElements.define("my-brick", MyBrick);

describe("preview", () => {
  const container = document.createElement("div");
  const portal = document.createElement("div");

  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  test("general", async () => {
    const root = unstable_createRoot(container);

    await root.render([
      {
        brick: "div",
        properties: {
          textContent: "Hello Preview",
        },
      },
    ]);

    expect(container.innerHTML).toBe("<div>Hello Preview</div>");
    expect(portal.innerHTML).toBe("");
    expect(applyTheme).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();

    root.unmount();
    expect(container.innerHTML).toBe("");
    expect(portal.innerHTML).toBe("");

    expect(() => root.render([{ brick: "div" }])).rejects.toMatchInlineSnapshot(
      `[Error: The root is unmounted and cannot be rendered any more]`
    );
  });

  test("with portal", async () => {
    const root = unstable_createRoot(container);

    await root.render([
      {
        brick: "div",
        properties: {
          textContent: "Hello Preview",
        },
      },
      {
        brick: "p",
        properties: {
          textContent: "I'm portal",
        },
        portal: true,
      },
    ]);

    expect(container.innerHTML).toBe("<div>Hello Preview</div>");
    expect(portal.innerHTML).toBe("");
    expect(document.body.lastElementChild?.innerHTML).toBe("<p>I'm portal</p>");
    expect(applyTheme).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();

    root.unmount();
    expect(container.innerHTML).toBe("");
    expect(portal.innerHTML).toBe("");
  });

  test("scope: page", async () => {
    const root = unstable_createRoot(container, { portal, scope: "page" });

    const bricks = [
      {
        brick: "tpl-test",
      },
      {
        brick: "p",
        properties: {
          textContent: "I'm also portal",
        },
        portal: true,
      },
    ];
    const i18nData = {
      en: {
        GOODBYE: "Goodbye",
      },
      zh: {
        GOODBYE: "再见",
      },
    };
    const options = {
      functions: [
        {
          name: "sayGoodbye",
          source: `
          function sayGoodBye(who) {
            return \`\${I18N("GOODBYE")} \${who}\`;
          }
        `,
        },
      ],
      templates: [
        {
          name: "tpl-test",
          bricks: [
            {
              brick: "div",
              properties: {
                textContent: "<% FN.sayGoodbye('Preview') %>",
              },
            },
          ],
        },
      ],
      i18n: i18nData,
    };
    await root.render(bricks, options);

    expect(container.firstElementChild?.innerHTML).toBe(
      "<div>Goodbye Preview</div>"
    );
    expect(portal.innerHTML).toBe("<p>I'm also portal</p>");
    expect(applyTheme).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledTimes(1);

    await root.render(bricks, {
      ...options,
      // Registered templates cannot be unregistered.
      templates: undefined,
      language: "zh",
    });
    expect(container.firstElementChild?.innerHTML).toBe(
      "<div>再见 Preview</div>"
    );

    root.unmount();
    expect(container.innerHTML).toBe("");
    expect(portal.innerHTML).toBe("");
    // Cover unmount again.
    root.unmount();
  });

  test("set url", async () => {
    const root = unstable_createRoot(container);

    await root.render(
      [
        {
          brick: "div",
          properties: {
            textContent: "<% QUERY.q %>",
          },
        },
      ],
      {
        url: "https://localhost/search?q=hello",
      }
    );

    expect(container.innerHTML).toBe("<div>hello</div>");

    root.unmount();
  });

  test("set app", async () => {
    const root = unstable_createRoot(container, { scope: "page" });

    await root.render(
      [
        {
          brick: "div",
          properties: {
            textContent: "<% APP.homepage %>",
          },
        },
      ],
      {
        app: {
          name: "TestApp",
          id: "test-app",
          homepage: "/test-app",
        },
      }
    );

    expect(container.innerHTML).toBe("<div>/test-app</div>");

    root.unmount();
  });

  test("unknown bricks", async () => {
    const consoleError = jest.spyOn(console, "error");
    consoleError.mockReturnValue();
    const root = unstable_createRoot(container, { unknownBricks: "silent" });

    await root.render([
      {
        brick: "unknown-brick",
        properties: {
          textContent: "silence",
        },
      } as any,
    ]);

    expect(container.innerHTML).toBe("<unknown-brick>silence</unknown-brick>");
    expect(portal.innerHTML).toBe("");
    expect(applyTheme).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();

    expect(consoleError).toHaveBeenCalledTimes(2);
    expect(consoleError).toHaveBeenNthCalledWith(
      1,
      "Package for unknown-brick not found."
    );
    expect(consoleError).toHaveBeenNthCalledWith(
      2,
      "Undefined custom element: unknown-brick"
    );

    root.unmount();
    expect(container.innerHTML).toBe("");
    expect(portal.innerHTML).toBe("");
    consoleError.mockRestore();
  });

  test("fail", async () => {
    const root = unstable_createRoot(container);

    await root.render([
      {
        brick: "div",
        properties: {
          textContent: "<% QUERY.q %>",
        },
      } as any,
    ]);

    expect(container.innerHTML).toBe(
      '<div data-error-boundary="" style="color: var(--color-error);"><div>UNKNOWN_ERROR: ReferenceError: QUERY is not defined, in "&lt;% QUERY.q %&gt;"</div></div>'
    );
    expect(portal.innerHTML).toBe("");
    expect(applyTheme).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();

    root.unmount();
    expect(container.innerHTML).toBe("");
    expect(portal.innerHTML).toBe("");
  });

  test("use children", async () => {
    const root = unstable_createRoot(container, {
      supportsUseChildren: true,
    });

    await root.render([
      {
        brick: "my-brick",
        properties: {
          useChildren: "[items]",
        },
        children: [
          {
            brick: "div",
            slot: "[items]",
            properties: {
              textContent: "Hello Use Children",
            },
          },
        ],
      },
    ]);

    expect(container.innerHTML).toBe("<my-brick></my-brick>");
    expect((container.firstElementChild as MyBrick).useBrick).toMatchObject({
      brick: "div",
      properties: {
        textContent: "Hello Use Children",
      },
    });

    root.unmount();
  });

  test("use children without supports", async () => {
    const root = unstable_createRoot(container);

    await root.render([
      {
        brick: "my-brick",
        properties: {
          useChildren: "[items]",
        },
        children: [
          {
            brick: "div",
            slot: "[items]",
            properties: {
              textContent: "Hello Use Children",
            },
          },
        ],
      },
    ]);

    expect(container.innerHTML).toBe(
      '<my-brick><div slot="[items]">Hello Use Children</div></my-brick>'
    );
    expect((container.firstElementChild as MyBrick).useBrick).toBe(undefined);

    root.unmount();
  });

  test("functions in scope fragment", async () => {
    const root = unstable_createRoot(container);

    await root.render(
      [
        {
          brick: "p",
          properties: {
            textContent: "<% FN.testFn() %>",
          },
        },
      ],
      {
        functions: [
          {
            name: "testFn",
            source: `
            function testFn() {
              return "Hello";
            }
          `,
          },
        ],
      }
    );

    expect(container.innerHTML).toBe("<p>Hello</p>");

    root.unmount();
  });

  test("templates in scope fragment", async () => {
    const consoleWarn = jest.spyOn(console, "warn");
    consoleWarn.mockReturnValue();
    const root = unstable_createRoot(container);

    await root.render(
      [
        {
          brick: "isolated-tpl-a",
        },
      ],
      {
        templates: [
          {
            name: "isolated-tpl-a",
            bricks: [
              {
                brick: "p",
                properties: {
                  textContent: "Template A",
                },
              },
            ],
          },
        ],
      }
    );

    const tpl = container.firstElementChild;
    expect(tpl?.tagName.toLowerCase()).toBe("isolated-tpl-a");
    expect(tpl?.innerHTML).toBe("<p>Template A</p>");

    expect(consoleWarn).toHaveBeenCalledTimes(0);

    // Redefine the same template.
    await root.render(
      [
        {
          brick: "isolated-tpl-a",
        },
      ],
      {
        templates: [
          {
            name: "isolated-tpl-a",
            bricks: [
              {
                brick: "p",
                properties: {
                  textContent: "Template A Updated",
                },
              },
            ],
          },
        ],
      }
    );
    expect(container.firstElementChild?.innerHTML).toBe(
      "<p>Template A Updated</p>"
    );
    expect(consoleWarn).toHaveBeenCalledTimes(1);

    root.unmount();
    consoleWarn.mockRestore();
  });

  test("using unknown templates in scope fragment", async () => {
    const consoleError = jest.spyOn(console, "error");
    consoleError.mockReturnValue();
    const root = unstable_createRoot(container);

    await root.render([
      {
        brick: "isolated-tpl-b",
      },
    ]);

    const tpl = container.firstElementChild;
    expect(tpl?.tagName.toLowerCase()).toBe("isolated-tpl-b");
    expect(tpl?.innerHTML).toBe("");

    root.unmount();
    consoleError.mockRestore();
  });
});
