import { unstable_createRoot } from "./createRoot.js";
import { applyTheme } from "./themeAndMode.js";

jest.mock("./themeAndMode.js");
window.scrollTo = jest.fn();

describe("preview", () => {
  const container = document.createElement("div");
  const portal = document.createElement("div");

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
    expect(applyTheme).not.toBeCalled();
    expect(scrollTo).not.toBeCalled();

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
    expect(applyTheme).not.toBeCalled();
    expect(scrollTo).not.toBeCalled();

    root.unmount();
    expect(container.innerHTML).toBe("");
    expect(portal.innerHTML).toBe("");
  });

  test("sandbox", async () => {
    const root = unstable_createRoot(container, { portal, scope: "page" });

    await root.render([
      {
        brick: "div",
        properties: {
          textContent: "Goodbye Preview",
        },
      },
      {
        brick: "p",
        properties: {
          textContent: "I'm also portal",
        },
        portal: true,
      },
    ]);

    expect(container.innerHTML).toBe("<div>Goodbye Preview</div>");
    expect(portal.innerHTML).toBe("<p>I'm also portal</p>");
    expect(applyTheme).toBeCalledTimes(1);
    expect(scrollTo).toBeCalledTimes(1);

    root.unmount();
    expect(container.innerHTML).toBe("");
    expect(portal.innerHTML).toBe("");
    // Cover unmount again.
    root.unmount();
  });

  test("fail", async () => {
    const root = unstable_createRoot(container);

    await root.render([
      {
        brick: "div",
        properties: {
          textContent: "<% oops %>",
        },
      } as any,
    ]);

    expect(container.innerHTML).toBe(
      '<div>ReferenceError: oops is not defined, in "&lt;% oops %&gt;"</div>'
    );
    expect(portal.innerHTML).toBe("");
    expect(applyTheme).not.toBeCalled();
    expect(scrollTo).not.toBeCalled();

    root.unmount();
    expect(container.innerHTML).toBe("");
    expect(portal.innerHTML).toBe("");
  });
});
