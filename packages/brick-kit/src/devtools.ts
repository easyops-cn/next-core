import { GeneralTransform } from "@easyops/brick-types";
import { get } from "lodash";
import { pipeableTransform } from "./transformProperties";
import { cook, precook } from "@easyops/brick-utils";
import { evaluate } from "./evaluate";
import { _internalApiGetCurrentContext } from "./core/Runtime";

export const MESSAGE_SOURCE_PANEL = "brick-next-devtools-panel";
export const EVALUATION_EDIT = "devtools-evaluation-edit";
export const TRANSFORMATION_EDIT = "devtools-transformation-edit";

interface DevtoolsHookContainer {
  __BRICK_NEXT_DEVTOOLS_HOOK__?: DevtoolsHook;
}

interface DevtoolsHook {
  emit: (message: any) => void;
}

/* istanbul ignore next */
export function devtoolsHookEmit(type: string, payload?: any): void {
  Promise.resolve().then(() => {
    const devHook = (window as DevtoolsHookContainer)
      .__BRICK_NEXT_DEVTOOLS_HOOK__;
    devHook?.emit?.({
      type,
      payload,
    });
  });
}

export function listenDevtools(): void {
  window.addEventListener("message", (event: MessageEvent): void => {
    if (
      event.data?.source === MESSAGE_SOURCE_PANEL &&
      event.data.payload?.type === EVALUATION_EDIT
    ) {
      let result;
      const { raw, context, id } = event.data.payload;
      try {
        result = evaluate(raw, context, { disabledNotifyDevTools: true });
      } catch (e) {
        result = e.message;
      }
      devtoolsHookEmit("re-evaluation", { raw, result, id });
    }

    if (
      event.data?.source === MESSAGE_SOURCE_PANEL &&
      event.data.payload?.type === TRANSFORMATION_EDIT
    ) {
      let result;
      const { data, transform, id } = event.data.payload;
      try {
        result = reProcessTransform(data, transform);
      } catch (e) {
        result = {
          result: e.message,
        };
      }

      devtoolsHookEmit("re-transformation", {
        ...result,
        id,
      });
    }
  });
}

export function reProcessTransform(
  data: any,
  to: GeneralTransform,
  from?: string | string[],
  mapArray?: boolean | "auto"
) {
  const output: any = {};
  if (from) {
    data = get(data, from);
  }
  if (Array.isArray(to)) {
    for (const item of to) {
      pipeableTransform(output, data, item.to, item.from, item.mapArray);
    }
  } else {
    pipeableTransform(output, data, to, undefined, mapArray);
  }

  return {
    transform: to,
    result: output,
  };
}
