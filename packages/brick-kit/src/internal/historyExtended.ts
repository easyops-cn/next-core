import { History, LocationDescriptorObject } from "history";
import {
  PluginHistoryState,
  ExtendedHistory,
  UpdateQueryFunction,
  UpdateQueryOptions,
  UpdateAnchorFunction,
} from "@next-core/brick-types";
import { getBasePath } from "./getBasePath";
import { _internalApiHasMatchedApp } from "../core/Runtime";

export function historyExtended(
  browserHistory: History<PluginHistoryState>
): ExtendedHistory {
  const { push: originalPush, replace: originalReplace } = browserHistory;
  function updateQueryFactory(method: "push" | "replace"): UpdateQueryFunction {
    return function updateQuery(
      query: Record<string, any>,
      options: UpdateQueryOptions = {}
    ): void {
      const { extraQuery, clear, keepHash, ...state } = options;
      const urlSearchParams = new URLSearchParams(
        clear ? "" : browserHistory.location.search
      );
      const params: Record<string, any> = {};
      Object.assign(params, query, extraQuery);
      for (const [key, value] of Object.entries(params)) {
        if (Array.isArray(value)) {
          urlSearchParams.delete(key);
          for (const item of value) {
            urlSearchParams.append(key, item);
          }
        } else if (value === undefined || value === null || value === "") {
          urlSearchParams.delete(key);
        } else {
          urlSearchParams.set(key, value);
        }
      }
      (method === "push" ? originalPush : originalReplace)(
        `?${urlSearchParams.toString()}${
          keepHash ? browserHistory.location.hash : ""
        }`,
        state
      );
    };
  }

  function updateAnchorFactory(
    method: "push" /* | "replace" */
  ): UpdateAnchorFunction {
    return function updateAnchor(
      hash: string,
      state?: PluginHistoryState
    ): void {
      (method === "push" ? originalPush : originalReplace)({
        ...browserHistory.location,
        key: undefined,
        hash,
        state: {
          // The default notify is false
          notify: false,
          ...state,
        },
      });
    };
  }

  function reload(): void {
    originalReplace({
      ...browserHistory.location,
      state: {
        ...browserHistory.location.state,
        // Always notify
        notify: true,
      },
    });
  }

  let blockMessage: string;

  function setBlockMessage(message: string): void {
    blockMessage = message;
  }

  function getBlockMessage(): string {
    return blockMessage;
  }

  function unblock(): void {
    blockMessage = undefined;
  }

  return {
    pushQuery: updateQueryFactory("push"),
    replaceQuery: updateQueryFactory("replace"),
    pushAnchor: updateAnchorFactory("push"),
    // replaceAnchor: updateAnchorFactory("replace"),
    reload,
    setBlockMessage,
    getBlockMessage,
    unblock,
    ...(window.STANDALONE_MICRO_APPS
      ? standaloneHistoryOverridden(browserHistory)
      : null),
  };
}

/**
 * Override history for standalone micro apps.
 *
 * when `push` or `replace` to other apps, force page refresh.
 */
function standaloneHistoryOverridden(
  browserHistory: History<PluginHistoryState>
): Pick<History<PluginHistoryState>, "push" | "replace"> {
  const { push: originalPush, replace: originalReplace } = browserHistory;
  function updateFactory(
    method: "push" | "replace"
  ): History<PluginHistoryState>["push"] {
    return function update(path, state?) {
      let pathname: string;
      const pathIsString = typeof path === "string";
      if (pathIsString) {
        pathname = path;
      } else {
        pathname = path.pathname;
      }
      if (_internalApiHasMatchedApp(pathname)) {
        return (method === "push" ? originalPush : originalReplace)(
          path as string,
          state
        );
      }
      // Going to outside apps.
      return location[method === "push" ? "assign" : "replace"](
        pathIsString
          ? getBasePath() + path.replace(/^\//, "")
          : browserHistory.createHref(
              path as LocationDescriptorObject<PluginHistoryState>
            )
      );
    };
  }
  return {
    push: updateFactory("push"),
    replace: updateFactory("replace"),
  };
}
