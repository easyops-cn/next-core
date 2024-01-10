import {
  History,
  LocationDescriptor,
  LocationDescriptorObject,
  parsePath,
} from "history";
import { getBasePath } from "../getBasePath.js";
import { _internalApiMatchStoryboard } from "./Runtime.js";
import { isOutsideApp } from "./matchStoryboard.js";

let blocked = false;
export function getUserConfirmation(
  message: string,
  callback: (result: boolean) => void
): void {
  blocked = !confirm(message);
  callback(!blocked);
}

export function historyExtended(
  browserHistory: History<NextHistoryState>
): ExtendedHistory {
  const { push: originalPush, replace: originalReplace } = browserHistory;

  function push(
    location: LocationDescriptor<NextHistoryState>,
    state?: NextHistoryState,
    callback?: (blocked: boolean) => void
  ): void {
    blocked = false;
    originalPush(location, state);
    callback?.(blocked);
  }

  function replace(
    location: LocationDescriptor<NextHistoryState>,
    state?: NextHistoryState,
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
    state?: NextHistoryState,
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
          // Do not use incremental sub routes
          noIncremental: true,
        },
      },
      undefined,
      callback
    );
  }

  let blockMessage: string | undefined;

  function setBlockMessage(message: string | undefined): void {
    blockMessage = message;
  }

  function getBlockMessage(): string | undefined {
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
  browserHistory: History<NextHistoryState> &
    Pick<ExtendedHistory, "push" | "replace">
): Pick<ExtendedHistory, "push" | "replace"> {
  const { push: originalPush, replace: originalReplace } = browserHistory;
  function updateFactory(method: "push" | "replace"): ExtendedHistory["push"] {
    return function update(path, state?, callback?) {
      let pathname: string | undefined;
      const pathIsString = typeof path === "string";
      if (pathIsString) {
        pathname = parsePath(path).pathname;
      } else {
        pathname = path.pathname;
      }

      // When history.push or history.replace is performing with an absolute pathname,
      // force load the target page when it is a page of an outside app.
      if (
        typeof pathname === "string" &&
        pathname.startsWith("/") &&
        isOutsideApp(_internalApiMatchStoryboard(pathname))
      ) {
        // Going to outside apps.
        return location[method === "push" ? "assign" : "replace"](
          pathIsString
            ? getBasePath() + path.substring(1)
            : browserHistory.createHref(
                path as LocationDescriptorObject<NextHistoryState>
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

export interface NextHistoryState {
  notify?: boolean;
  from?: LocationDescriptor<NextHistoryState>;
  noIncremental?: boolean;
}

/**
 * 扩展的系统会话对象。
 */
export interface ExtendedHistory {
  /**
   * 更新指定的 query 参数，会保留当前其它 query 参数，往浏览器会话历史栈中推入一条新记录。
   */
  pushQuery: UpdateQueryFunction;

  /**
   * 更新指定的 query 参数，会保留当前其它 query 参数，替换浏览器会话历史栈中最新的一条记录。
   */
  replaceQuery: UpdateQueryFunction;

  /** {@inheritDoc UpdateAnchorFunction} */
  pushAnchor: UpdateAnchorFunction;

  /** 重载当前会话，即触发页面重新渲染。与 location.reload() 不同，它不会触发浏览器页面的重载。 */
  reload: (callback?: (blocked: boolean) => void) => void;

  /** @internal */
  setBlockMessage: (message: string | undefined) => void;

  /** @internal */
  getBlockMessage: () => string | undefined;

  /** 取消之前设置的阻止页面离开信息的设置。 */
  unblock: () => void;

  /** 推入一条记录。*/
  push: (
    location: LocationDescriptor<NextHistoryState>,
    state?: NextHistoryState,
    callback?: (blocked: boolean) => void
  ) => void;

  /** 替换一条记录。*/
  replace: (
    location: LocationDescriptor<NextHistoryState>,
    state?: NextHistoryState,
    callback?: (blocked: boolean) => void
  ) => void;
}

/**
 * 更新指定的 query 参数。
 *
 * @param query - 要更新的 query 参数。
 * @param options - 选项。
 */
export type UpdateQueryFunction = (
  query: Record<string, unknown>,
  options?: UpdateQueryOptions,
  callback?: (blocked: boolean) => void
) => void;

/** 更新 query 参数时的选项 */
export interface UpdateQueryOptions extends NextHistoryState {
  /** 额外要更新的 query 参数。 */
  extraQuery?: Record<string, unknown>;
  /** 是否同时清除当前的所有其它 query 参数。 */
  clear?: boolean;
  /** 是否保留当前 hash 参数。 */
  keepHash?: boolean;
}

/**
 * 设置指定的 anchor （URL hash）地址，此方法默认不会触发页面重新渲染。
 * 往浏览器会话历史栈中推入一条新记录。
 *
 * @param hash - Hash 地址。
 * @param state - 会话状态设置。
 */
export type UpdateAnchorFunction = (
  hash: string,
  state?: NextHistoryState,
  callback?: (blocked: boolean) => void
) => void;
