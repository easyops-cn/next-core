import {
  UpdateQueryFunction,
  UpdateAnchorFunction,
  PluginLocation,
  PluginHistoryState,
} from "@next-core/brick-types";
import { History } from "history";
import { historyExtended } from "./historyExtended";
import { _internalApiHasMatchedApp } from "../core/Runtime";

jest.mock("../core/Runtime", () => ({
  _internalApiHasMatchedApp: jest.fn(),
}));

const mockHasMatchedApp = _internalApiHasMatchedApp as jest.Mock;

describe("historyExtended", () => {
  const location = window.location;
  delete window.location;
  window.location = {
    assign: jest.fn(),
    replace: jest.fn(),
  } as unknown as Location;

  const history = {
    push: jest.fn(),
    replace: jest.fn(),
    location: {
      pathname: "/a",
      search: "?b=1",
      hash: "#c",
      key: "d",
      state: {
        from: "e",
      },
    },
    createHref(path: any) {
      return path.pathname;
    },
  } as any;
  let ext: ReturnType<typeof historyExtended>;

  afterEach(() => {
    history.push.mockClear();
    history.replace.mockClear();
    window.STANDALONE_MICRO_APPS = undefined;
  });

  afterAll(() => {
    window.location = location;
  });

  it.each<[Parameters<UpdateQueryFunction>, [string, Record<string, any>]]>([
    [
      [
        {
          page: 2,
        },
      ],
      ["?b=1&page=2", {}],
    ],
    [
      [
        {
          page: 2,
        },
        {
          clear: true,
        },
      ],
      ["?page=2", {}],
    ],
    [
      [
        {
          page: 2,
          asc: undefined,
          sort: null,
          q: "",
          emptyArray: [],
          array: [3, 4],
        },
        {
          extraQuery: {
            pageSize: 10,
          },
        },
      ],
      ["?b=1&page=2&array=3&array=4&pageSize=10", {}],
    ],
    [
      [
        {
          page: 2,
        },
        {
          notify: false,
        },
      ],
      [
        "?b=1&page=2",
        {
          notify: false,
        },
      ],
    ],
    [
      [
        {
          page: 2,
        },
        {
          extraQuery: {
            pageSize: 10,
          },
          notify: false,
        },
      ],
      [
        "?b=1&page=2&pageSize=10",
        {
          notify: false,
        },
      ],
    ],
    [
      [
        {
          page: 2,
        },
        {
          keepHash: true,
        },
      ],
      ["?b=1&page=2#c", {}],
    ],
  ])(
    "history.pushQuery(...%j) should call history.push(...%j)",
    (callerArgs, calleeArgs) => {
      ext = historyExtended(history);
      ext.pushQuery(...callerArgs);
      expect(history.push).toBeCalledWith(...calleeArgs);
    }
  );

  it.each<[Parameters<UpdateQueryFunction>, [string, Record<string, any>]]>([
    [
      [
        {
          page: 2,
        },
        {
          extraQuery: {
            pageSize: 10,
          },
          notify: false,
        },
      ],
      [
        "?b=1&page=2&pageSize=10",
        {
          notify: false,
        },
      ],
    ],
  ])(
    "history.replaceQuery(...%j) should call history.replace(...%j)",
    (callerArgs, calleeArgs) => {
      ext = historyExtended(history);
      ext.replaceQuery(...callerArgs);
      expect(history.replace).toBeCalledWith(...calleeArgs);
    }
  );

  it.each<[Parameters<UpdateAnchorFunction>, PluginLocation]>([
    [
      ["yes"],
      {
        pathname: "/a",
        search: "?b=1",
        hash: "yes",
        key: undefined,
        state: {
          notify: false,
        },
      },
    ],
    [
      [
        "yes",
        {
          notify: true,
        },
      ],
      {
        pathname: "/a",
        search: "?b=1",
        hash: "yes",
        key: undefined,
        state: {
          notify: true,
        },
      },
    ],
    [
      [""],
      {
        pathname: "/a",
        search: "?b=1",
        hash: "",
        key: undefined,
        state: {
          notify: false,
        },
      },
    ],
  ])(
    "history.pushAnchor(...%j) should call history.push(%j)",
    (callerArgs, loc) => {
      ext = historyExtended(history);
      ext.pushAnchor(...callerArgs);
      expect(history.push).toBeCalledWith(loc);
    }
  );

  it("should work for history.reload", () => {
    ext = historyExtended(history);
    ext.reload();
    expect(history.replace).toBeCalledWith({
      pathname: "/a",
      search: "?b=1",
      hash: "#c",
      key: "d",
      state: {
        from: "e",
        notify: true,
      },
    });
  });

  it.each<
    [
      "push" | "replace",
      Parameters<History<PluginHistoryState>["push"]>,
      [unknown, PluginHistoryState?]
    ]
  >([
    ["push", ["/my-app"], ["/my-app", undefined]],
    [
      "replace",
      [
        {
          pathname: "/my-app/hello",
        },
        {
          from: "good",
        },
      ] as any,
      [
        {
          pathname: "/my-app/hello",
        },
        { from: "good" },
      ],
    ],
  ])(
    "history[%j](...%j) with the same up should work for standalone micro-apps",
    (method, callerArgs, calleeArgs) => {
      window.STANDALONE_MICRO_APPS = true;
      mockHasMatchedApp.mockReturnValueOnce(true);
      ext = historyExtended(history);
      ext[method](...callerArgs);
      expect(history[method]).toBeCalledWith(...calleeArgs);
    }
  );

  it.each<
    [
      "push" | "replace",
      Parameters<History<PluginHistoryState>["push"]>,
      string
    ]
  >([
    ["push", ["/another-app"], "/another-app"],
    [
      "replace",
      [
        {
          pathname: "/another-app/path",
        },
        {
          from: "good",
        },
      ] as any,
      "/another-app/path",
    ],
  ])(
    "history[%j](...%j) with the same up should work for standalone micro-apps",
    (method, callerArgs, url) => {
      window.STANDALONE_MICRO_APPS = true;
      mockHasMatchedApp.mockReturnValueOnce(false);
      ext = historyExtended(history);
      ext[method](...callerArgs);
      expect(
        window.location[method === "push" ? "assign" : "replace"]
      ).toBeCalledWith(url);
    }
  );
});
