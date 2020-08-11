import { evaluate } from "./evaluate";
import { reTransformForDevtools } from "./transformProperties";

export const MESSAGE_SOURCE_PANEL = "brick-next-devtools-panel";
export const EVALUATION_EDIT = "devtools-evaluation-edit";
export const TRANSFORMATION_EDIT = "devtools-transformation-edit";

interface DevtoolsHookContainer {
  __BRICK_NEXT_DEVTOOLS_HOOK__?: DevtoolsHook;
}

interface DevtoolsHook {
  emit: (message: any) => void;
  restoreDehydrated: (value: unknown) => any;
}

interface EditEvaluationPayload {
  raw: string;
  context: {
    data?: any;
    event?: any;
  };
  id: number;
}

interface EditEvaluationPayload {
  type: typeof EVALUATION_EDIT;
  raw: string;
  context: {
    data?: any;
    event?: any;
  };
  id: number;
}

interface EditTransformationPayload {
  type: typeof TRANSFORMATION_EDIT;
  data: any;
  transform: any;
  options: {
    from?: string | string[];
    mapArray?: boolean | "auto";
  };
  id: number;
}

/* istanbul ignore next */
export function devtoolsHookEmit(type: string, payload?: unknown): void {
  Promise.resolve().then(() => {
    getDevHook()?.emit?.({
      type,
      payload,
    });
  });
}

export function listenDevtools(): void {
  window.addEventListener("message", (event: MessageEvent): void => {
    if (event.data?.source !== MESSAGE_SOURCE_PANEL) {
      return;
    }
    const payload: EditEvaluationPayload | EditTransformationPayload =
      event.data.payload;
    if (payload?.type === EVALUATION_EDIT) {
      const { raw, context, id } = payload;
      evaluate(
        raw,
        {
          data: context.data,
          event: restoreDehydrated(context.event),
        },
        {
          isReEvaluation: true,
          evaluationId: id,
        }
      );
    } else if (payload?.type === TRANSFORMATION_EDIT) {
      const {
        data,
        transform,
        id,
        options: { from, mapArray },
      } = payload;
      reTransformForDevtools(id, data, transform, from, mapArray);
    }
  });
}

function getDevHook(): DevtoolsHook {
  return (window as DevtoolsHookContainer).__BRICK_NEXT_DEVTOOLS_HOOK__;
}

function restoreDehydrated(value: unknown): any {
  return getDevHook()?.restoreDehydrated(value) ?? value;
}
