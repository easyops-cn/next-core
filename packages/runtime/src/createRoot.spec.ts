import { i18n, initializeI18n } from "@next-core/i18n";
import { unstable_createRoot } from "./createRoot.js";
import { applyTheme } from "./themeAndMode.js";

initializeI18n();
const consoleError = jest.spyOn(console, "error");
jest.mock("./themeAndMode.js");
window.scrollTo = jest.fn();

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
      '<div data-error-boundary=""><div>UNKNOWN_ERROR: ReferenceError: QUERY is not defined, in "&lt;% QUERY.q %&gt;"</div></div>'
    );
    expect(portal.innerHTML).toBe("");
    expect(applyTheme).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();

    root.unmount();
    expect(container.innerHTML).toBe("");
    expect(portal.innerHTML).toBe("");
  });
});
