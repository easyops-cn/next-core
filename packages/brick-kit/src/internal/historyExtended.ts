import {
  History,
  LocationDescriptor,
  LocationDescriptorObject,
  parsePath,
} from "history";
import {
  PluginHistoryState,
  ExtendedHistory,
  UpdateQueryFunction,
} from "@next-core/brick-types";
import { getBasePath } from "./getBasePath";
import { _internalApiMatchStoryboard } from "../core/Runtime";
import { isOutsideApp } from "../core/matchStoryboard";

let blocked = false;
export function getUserConfirmation(
  message: string,
  callback: (result: boolean) => void
): void {
  blocked = !confirm(message);
  callback(!blocked);
}

export function historyExtended(
  browserHistory: History<PluginHistoryState>
): ExtendedHistory {
  const { push: originalPush, replace: originalReplace } = browserHistory;

  function push(
    location: LocationDescriptor<PluginHistoryState>,
    state?: PluginHistoryState,
    callback?: (blocked: boolean) => void
  ): void {
    blocked = false;
    originalPush(location, state);
    callback?.(blocked);
  }

  function replace(
    location: LocationDescriptor<PluginHistoryState>,
    state?: PluginHistoryState,
    callback?: (blocked: boolean) => void
  ): void {
    blocked = false;
    originalReplace(location, state);
    callback?.(blocked);
  }

  function updateQueryFactory(method: "push" | "replace"): UpdateQueryFunction {
    return function updateQuery(query, options = {}, callback?): void {
      const { extraQuery, clear, keepHash, ...state } = options;
      const urlSearchParams = new URLSearchParams(
        clear ? "" : browserHistory.location.search
      );
      const params: Record<string, string | string[]> = {};
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
      (method === "push" ? push : replace)(
        `?${urlSearchParams.toString()}${
          keepHash ? browserHistory.location.hash : ""
        }`,
        state,
        callback
      );
    };
  }

  function pushAnchor(
    hash: string,
    state?: PluginHistoryState,
    callback?: (blocked: boolean) => void
  ): void {
    push(
      {
        ...browserHistory.location,
        key: undefined,
        hash,
        state: {
          // The default notify is false
          notify: false,
          ...state,
        },
      },
      undefined,
      callback
    );
  }

  function reload(callback?: (blocked: boolean) => void): void {
    replace(
      {
        ...browserHistory.location,
        state: {
          ...browserHistory.location.state,
          // Always notify
          notify: true,
        },
      },
      undefined,
      callback
    );
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
    pushAnchor: pushAnchor,
    reload,
    setBlockMessage,
    getBlockMessage,
    unblock,
    ...historyOverridden({ ...browserHistory, push, replace }),
  };
}

/**
 * Override history for standalone micro apps.
 *
 * when `push` or `replace` to other apps, force page refresh.
 */
function historyOverridden(
  browserHistory: History<PluginHistoryState> &
    Pick<ExtendedHistory, "push" | "replace">
): Pick<ExtendedHistory, "push" | "replace"> {
  const { push: originalPush, replace: originalReplace } = browserHistory;
  function updateFactory(method: "push" | "replace"): ExtendedHistory["push"] {
    return function update(path, state?, callback?) {
      let pathname: string;
      const pathIsString = typeof path === "string";
      if (pathIsString) {
        pathname = parsePath(path).pathname;
      } else {
        pathname = path.pathname;
      }

      // When history.push or history.replace is performing with a non-empty pathname,
      // force load the target page when it is a page of an outside app.
      if (
        pathname !== "" &&
        isOutsideApp(_internalApiMatchStoryboard(pathname))
      ) {
        // Going to outside apps.
        return location[method === "push" ? "assign" : "replace"](
          pathIsString
            ? getBasePath() + path.replace(/^\//, "")
            : browserHistory.createHref(
                path as LocationDescriptorObject<PluginHistoryState>
              )
        );
      }

      return (method === "push" ? originalPush : originalReplace)(
        path as string,
        state,
        callback
      );
    };
  }
  return {
    push: updateFactory("push"),
    replace: updateFactory("replace"),
  };
}
