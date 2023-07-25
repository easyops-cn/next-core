import * as runtime from "@next-core/runtime";
import { capture } from "./capture.js";
import {
  setPreviewFromOrigin,
  startInspecting,
  stopInspecting,
} from "./inspector.js";
import connect from "./connect.js";
jest.mock("@next-core/runtime");
jest.mock("./inspector.js");
jest.mock("./capture.js");

const historyListeners = new Set<(loc: string) => void>();
const history = {
  location: {
    pathname: "/a",
  },
  createHref(loc: runtime.NextLocation) {
    return `/next${loc.pathname}`;
  },
  listen(fn: any) {
    historyListeners.add(fn);
  },
  push(pathname: string) {
    this.location = {
      pathname,
    };
    for (const fn of historyListeners) {
      fn(this.location);
    }
  },
  reload: jest.fn(),
  goForward: jest.fn(),
  goBack: jest.fn(),
} as any;
jest.spyOn(runtime, "getHistory").mockReturnValue(history);
// jest.spyOn(runtime.__secret_internals, "updateStoryboard").mockImplementation();
jest
  .spyOn(runtime.__secret_internals, "updateTemplatePreviewSettings")
  .mockImplementation();
jest
  .spyOn(runtime.__secret_internals, "updateStoryboardByRoute")
  .mockImplementation();
jest
  .spyOn(runtime.__secret_internals, "updateStoryboardByTemplate")
  .mockImplementation();
jest
  .spyOn(runtime.__secret_internals, "updateStoryboardBySnippet")
  .mockImplementation();
// jest.spyOn(runtime.__secret_internals, "updateFormPreviewSettings").mockImplementation();
jest
  .spyOn(runtime, "matchPath")
  .mockImplementation((pathname, options) =>
    pathname === options.path ? ({} as any) : null
  );
jest.spyOn(runtime.__secret_internals, "getContextValue").mockImplementation();
jest
  .spyOn(runtime.__secret_internals, "getAllContextValues")
  .mockImplementation();
const mockCapture = capture as jest.Mock;

delete (window as any).location;
window.location = {
  origin: "http://localhost",
  reload: jest.fn(),
} as unknown as Location;

const parentPostMessage = jest.fn();
// Must delete it first in Jest.
delete (window as any).parent;
window.parent = {
  postMessage: parentPostMessage,
} as any;

const addEventListener = jest.spyOn(window, "addEventListener");

const brick = document.createElement("div");
brick.dataset.iid = "i-01";
document.body.appendChild(brick);

const mainElement = document.createElement("div");
mainElement.setAttribute("id", "main-mount-point");

const span = document.createElement("span");
span.dataset.tplStateStoreId = "tpl-state-8";

mainElement.appendChild(span);
document.body.appendChild(mainElement);

describe("connect", () => {
  it("should work", async () => {
    connect("http://localhost:8081", {
      routePath: "/a",
      routeExact: true,
      appId: "my-app",
      templateId: "my-tpl",
    });
    expect(history.reload).toBeCalledTimes(1);
    expect(setPreviewFromOrigin).toBeCalledWith("http://localhost:8081");
    expect(parentPostMessage).toBeCalledTimes(3);
    expect(parentPostMessage).toHaveBeenNthCalledWith(
      1,
      {
        sender: "previewer",
        type: "preview-started",
      },
      "http://localhost:8081"
    );
    expect(parentPostMessage).toHaveBeenNthCalledWith(
      2,
      {
        sender: "previewer",
        type: "url-change",
        url: "http://localhost/next/a",
      },
      "http://localhost:8081"
    );
    expect(parentPostMessage).toHaveBeenNthCalledWith(
      3,
      {
        sender: "previewer",
        type: "route-match-change",
        match: true,
      },
      "http://localhost:8081"
    );

    history.push("/b");
    expect(parentPostMessage).toBeCalledTimes(5);
    expect(parentPostMessage).toHaveBeenNthCalledWith(
      4,
      {
        sender: "previewer",
        type: "url-change",
        url: "http://localhost/next/b",
      },
      "http://localhost:8081"
    );
    expect(parentPostMessage).toHaveBeenNthCalledWith(
      5,
      {
        sender: "previewer",
        type: "route-match-change",
        match: false,
      },
      "http://localhost:8081"
    );

    // Ignore re-start.
    connect("http://localhost:8081", { appId: "test" });
    expect(parentPostMessage).toBeCalledTimes(5);

    const listener = addEventListener.mock.calls[0][1] as EventListener;
    listener({
      // From different origin.
      origin: "http://localhost:3000",
      data: {
        sender: "preview-container",
        type: "toggle-inspecting",
      },
    } as any);
    listener({
      // Data is null.
      origin: "http://localhost:8081",
      data: null,
    } as any);
    listener({
      // Unknown type.
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "unknown",
      },
    } as any);
    listener({
      // No `forwardedFor`.
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "hover-on-brick",
        iid: "i-01",
      },
    } as any);
    listener({
      // Unexpected sender.
      origin: "http://localhost:8081",
      data: {
        sender: "builder",
        type: "toggle-inspecting",
      },
    } as any);
    expect(startInspecting).not.toBeCalled();
    expect(stopInspecting).not.toBeCalled();

    // Hover on brick.
    listener({
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "hover-on-brick",
        forwardedFor: "builder",
        iid: "i-01",
      },
    } as any);
    expect(parentPostMessage).toBeCalledTimes(6);
    expect(parentPostMessage).toHaveBeenNthCalledWith(
      6,
      {
        sender: "previewer",
        type: "highlight-brick",
        highlightType: "hover",
        outlines: [{ width: 0, height: 0, left: 0, top: 0 }],
        iid: "i-01",
      },
      "http://localhost:8081"
    );

    // Select brick.
    listener({
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "select-brick",
        forwardedFor: "builder",
        iid: "i-01",
      },
    } as any);
    expect(parentPostMessage).toBeCalledTimes(7);
    expect(parentPostMessage).toHaveBeenNthCalledWith(
      7,
      {
        sender: "previewer",
        type: "highlight-brick",
        highlightType: "active",
        outlines: [{ width: 0, height: 0, left: 0, top: 0 }],
        iid: "i-01",
      },
      "http://localhost:8081"
    );

    // Unselect brick.
    listener({
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "select-brick",
        forwardedFor: "builder",
        iid: null,
      },
    } as any);
    expect(parentPostMessage).toBeCalledTimes(8);
    expect(parentPostMessage).toHaveBeenNthCalledWith(
      8,
      {
        sender: "previewer",
        type: "highlight-brick",
        highlightType: "active",
        outlines: [],
        iid: null,
      },
      "http://localhost:8081"
    );

    listener({
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "toggle-inspecting",
        enabled: true,
      },
    } as any);
    expect(startInspecting).toBeCalledTimes(1);

    listener({
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "toggle-inspecting",
        enabled: false,
      },
    } as any);
    expect(stopInspecting).toBeCalledTimes(1);

    listener({
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "reload",
      },
    } as any);
    expect(window.location.reload).toBeCalledTimes(1);

    listener({
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "refresh",
        storyboardPatch: { routes: [] },
      },
    } as any);
    expect(runtime.__secret_internals.updateStoryboard).toBeCalledWith(
      "my-app",
      {
        routes: [],
      }
    );
    expect(history.reload).toBeCalledTimes(2);

    listener({
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "refresh",
        storyboardPatch: { routes: [] },
        settings: {
          properties: { dataTest: "good" },
        },
      },
    } as any);
    expect(
      runtime.__secret_internals.updateTemplatePreviewSettings
    ).toBeCalledWith("my-app", "my-tpl", {
      properties: { dataTest: "good" },
    });
    expect(history.reload).toBeCalledTimes(3);

    mockCapture.mockResolvedValueOnce("data:image/png;base64");
    listener({
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "capture",
        maxWidth: 200,
        maxHeight: 150,
      },
    } as any);
    expect(capture).toHaveBeenNthCalledWith(1, 200, 150);
    expect(parentPostMessage).toBeCalledTimes(8);
    await (global as any).flushPromises();
    expect(parentPostMessage).toBeCalledTimes(9);
    expect(parentPostMessage).toHaveBeenNthCalledWith(
      9,
      {
        sender: "previewer",
        type: "capture-ok",
        screenshot: "data:image/png;base64",
      },
      "http://localhost:8081"
    );

    mockCapture.mockRejectedValueOnce(null);
    listener({
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "capture",
        maxWidth: 400,
        maxHeight: 300,
      },
    } as any);
    expect(capture).toHaveBeenNthCalledWith(2, 400, 300);
    expect(parentPostMessage).toBeCalledTimes(9);
    await (global as any).flushPromises();
    expect(parentPostMessage).toBeCalledTimes(10);
    expect(parentPostMessage).toHaveBeenNthCalledWith(
      10,
      {
        sender: "previewer",
        type: "capture-failed",
      },
      "http://localhost:8081"
    );

    listener({
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "hover-on-context",
        forwardedFor: "builder",
        highlightNodes: [
          {
            iid: "i-01",
            alias: "test",
          },
        ],
      },
    } as any);
    expect(parentPostMessage).toBeCalledTimes(11);
    expect(parentPostMessage).toHaveBeenNthCalledWith(
      11,
      {
        sender: "previewer",
        type: "highlight-context",
        outlines: [{ width: 0, height: 0, left: 0, top: 0, alias: "test" }],
      },
      "http://localhost:8081"
    );

    // listener({
    //   origin: "http://localhost:8081",
    //   data: {
    //     sender: "preview-container",
    //     type: "excute-proxy-method",
    //     proxyMethodArgs: ["div", "getAttributeNames"],
    //   },
    // } as any);
    // expect(parentPostMessage).toBeCalledTimes(12);
    // expect(parentPostMessage).toHaveBeenNthCalledWith(12, {
    //   data: {
    //     method: "getAttributeNames",
    //     res: ["data-iid"],
    //   },
    //   sender: "previewer",
    //   type: "excute-proxy-method-success",
    // });

    // listener({
    //   origin: "http://localhost:8081",
    //   data: {
    //     sender: "preview-container",
    //     type: "excute-proxy-method",
    //     proxyMethodArgs: ["div", "test"],
    //   },
    // } as any);
    // expect(parentPostMessage).toBeCalledTimes(13);
    // expect(parentPostMessage).toHaveBeenNthCalledWith(13, {
    //   data: {
    //     method: "test",
    //     res: "document.body.querySelector(...)[method] is not a function",
    //   },
    //   sender: "previewer",
    //   type: "excute-proxy-method-error",
    // });

    listener({
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "refresh",
        storyboardPatch: { routes: [] },
        options: {
          updateStoryboardType: "route",
        },
      },
    } as any);

    expect(runtime.__secret_internals.updateStoryboardByRoute).toBeCalledWith(
      "my-app",
      {
        routes: [],
      }
    );

    listener({
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "refresh",
        storyboardPatch: { routes: [] },
        options: {
          updateStoryboardType: "template",
          settings: {
            properties: {
              textContent: 123,
            },
          },
        },
      },
    } as any);

    expect(
      runtime.__secret_internals.updateStoryboardByTemplate
    ).toBeCalledWith(
      "my-app",
      {
        routes: [],
      },
      {
        properties: {
          textContent: 123,
        },
      }
    );

    listener({
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "refresh",
        storyboardPatch: { snippetId: "test-snippet", bricks: [] },
        options: {
          updateStoryboardType: "snippet",
        },
      },
    } as any);

    expect(runtime.__secret_internals.updateStoryboardBySnippet).toBeCalledWith(
      "my-app",
      {
        snippetId: "test-snippet",
        bricks: [],
      }
    );

    listener({
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "refresh",
        storyboardPatch: { formSchema: {}, fieldList: [] },
        options: {
          updateStoryboardType: "form",
        },
      },
    } as any);

    // expect(runtime.__secret_internals.updateFormPreviewSettings).toBeCalledWith(
    //   "my-app",
    //   undefined,
    //   { formSchema: {}, fieldList: [] }
    // );

    // listener({
    //   origin: "http://localhost:8081",
    //   data: {
    //     sender: "preview-container",
    //     type: "back",
    //   },
    // } as any);

    // expect(history.goBack).toBeCalledTimes(1);

    listener({
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "forward",
      },
    } as any);

    expect(history.goForward).toBeCalledTimes(1);

    listener({
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "inspect-data-value",
        name: "pageSize",
        option: {
          dataType: "context",
        },
      },
    } as any);

    expect(runtime.__secret_internals.getContextValue).toHaveBeenLastCalledWith(
      "pageSize",
      {
        tplStateStoreId: undefined,
      }
    );

    listener({
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "inspect-data-value",
        name: undefined,
        option: {
          dataType: "context",
        },
      },
    } as any);

    expect(
      runtime.__secret_internals.getAllContextValues
    ).toHaveBeenLastCalledWith({
      tplStateStoreId: undefined,
    });

    listener({
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "inspect-data-value",
        name: "name",
        option: {
          dataType: "state",
        },
      },
    } as any);

    expect(runtime.__secret_internals.getContextValue).toHaveBeenLastCalledWith(
      "name",
      {
        tplStateStoreId: "tpl-state-8",
      }
    );

    listener({
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "inspect-data-value",
        name: undefined,
        option: {
          dataType: "state",
        },
      },
    } as any);

    expect(
      runtime.__secret_internals.getAllContextValues
    ).toHaveBeenLastCalledWith({
      tplStateStoreId: "tpl-state-8",
    });

    span.dataset.tplStateStoreId = "";

    listener({
      origin: "http://localhost:8081",
      data: {
        sender: "preview-container",
        type: "inspect-data-value",
        name: "name",
        option: {
          dataType: "state",
        },
      },
    } as any);

    expect(parentPostMessage).toHaveBeenNthCalledWith(
      16,
      {
        sender: "previewer",
        type: "inspect-data-value-error",
        data: {
          error: {
            message: "tplStateStoreId not found, unable to preview STATE value",
          },
        },
      },
      "http://localhost:8081"
    );
  });
});
