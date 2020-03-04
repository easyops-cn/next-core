import { historyExtended } from "./historyExtended";
import {
  UpdateQueryFunction,
  UpdateAnchorFunction,
  PluginLocation
} from "@easyops/brick-types";

describe("historyExtended", () => {
  const history = {
    push: jest.fn(),
    replace: jest.fn(),
    location: {
      pathname: "/a",
      search: "?b=1",
      hash: "#c",
      key: "d",
      state: {
        from: "e"
      }
    }
  };
  const ext = historyExtended(history as any);

  afterEach(() => {
    history.push.mockClear();
    history.replace.mockClear();
  });

  it.each<[Parameters<UpdateQueryFunction>, [string, Record<string, any>]]>([
    [
      [
        {
          page: 2
        }
      ],
      ["?b=1&page=2", {}]
    ],
    [
      [
        {
          page: 2,
          asc: undefined,
          sort: null,
          q: "",
          emptyArray: [],
          array: [3, 4]
        },
        {
          extraQuery: {
            pageSize: 10
          }
        }
      ],
      ["?b=1&page=2&array=3&array=4&pageSize=10", {}]
    ],
    [
      [
        {
          page: 2
        },
        {
          notify: false
        }
      ],
      [
        "?b=1&page=2",
        {
          notify: false
        }
      ]
    ],
    [
      [
        {
          page: 2
        },
        {
          extraQuery: {
            pageSize: 10
          },
          notify: false
        }
      ],
      [
        "?b=1&page=2&pageSize=10",
        {
          notify: false
        }
      ]
    ]
  ])(
    "history.pushQuery(...%j) should call history.push(...%j)",
    (callerArgs, calleeArgs) => {
      ext.pushQuery(...callerArgs);
      expect(history.push).toBeCalledWith(...calleeArgs);
    }
  );

  it.each<[Parameters<UpdateQueryFunction>, [string, Record<string, any>]]>([
    [
      [
        {
          page: 2
        },
        {
          extraQuery: {
            pageSize: 10
          },
          notify: false
        }
      ],
      [
        "?b=1&page=2&pageSize=10",
        {
          notify: false
        }
      ]
    ]
  ])(
    "history.replaceQuery(...%j) should call history.replace(...%j)",
    (callerArgs, calleeArgs) => {
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
          notify: false
        }
      }
    ],
    [
      [
        "yes",
        {
          notify: true
        }
      ],
      {
        pathname: "/a",
        search: "?b=1",
        hash: "yes",
        key: undefined,
        state: {
          notify: true
        }
      }
    ],
    [
      [""],
      {
        pathname: "/a",
        search: "?b=1",
        hash: "",
        key: undefined,
        state: {
          notify: false
        }
      }
    ]
  ])(
    "history.pushAnchor(...%j) should call history.push(%j)",
    (callerArgs, loc) => {
      ext.pushAnchor(...callerArgs);
      expect(history.push).toBeCalledWith(loc);
    }
  );

  it("should work for history.reload", () => {
    ext.reload();
    expect(history.replace).toBeCalledWith({
      pathname: "/a",
      search: "?b=1",
      hash: "#c",
      key: "d",
      state: {
        from: "e",
        notify: true
      }
    });
  });
});
