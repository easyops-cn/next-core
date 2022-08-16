import { evaluate } from "./evaluate";
import { reTransformForDevtools } from "../transformProperties";

export const MESSAGE_SOURCE_PANEL = "brick-next-devtools-panel";
export const EVALUATION_EDIT = "devtools-evaluation-edit";
export const TRANSFORMATION_EDIT = "devtools-transformation-edit";
export const FRAME_ACTIVE_CHANGE = "devtools-frame-active-change";
export const PANEL_CHANGE = "devtools-panel-change";

interface DevtoolsHookContainer {
  __BRICK_NEXT_DEVTOOLS_HOOK__?: DevtoolsHook;
}

interface DevtoolsHook {
  emit: (message: any) => void;
  restoreDehydrated: (value: unknown) => any;
}

type DevtoolsMessagePayload =
  | EditEvaluationPayload
  | EditTransformationPayload
  | FrameActiveChangePayload
  | PanelChangePayload;

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
    allowInject?: boolean;
  };
  id: number;
}

interface FrameActiveChangePayload {
  type: typeof FRAME_ACTIVE_CHANGE;
  active: boolean;
  panel: PanelType;
}

type PanelType = "Bricks" | "Evaluations" | "Transformations";

interface PanelChangePayload {
  type: typeof PANEL_CHANGE;
  panel: PanelType;
}

let frameIsActive = true;
let selectedPanel: PanelType;

/* istanbul ignore next */
export function devtoolsHookEmit(type: string, payload?: unknown): void {
  const devtools = getDevHook();
  if (
    !devtools ||
    !(type === "evaluation"
      ? frameIsActive && (!selectedPanel || selectedPanel === "Evaluations")
      : type === "transformation"
      ? frameIsActive && (!selectedPanel || selectedPanel === "Transformations")
      : true)
  ) {
    // Ignore messages if current devtools panel is not relevant.
    return;
  }

  const emit = (): void => {
    devtools.emit?.({
      type,
      payload,
    });
  };

  // Try to emit only in idle time.
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(emit);
  } else {
    setTimeout(emit, 0);
  }
}

export function listenDevtoolsEagerly(): void {
  window.addEventListener("message", ({ data }: MessageEvent): void => {
    if (data?.source !== MESSAGE_SOURCE_PANEL) {
      return;
    }
    const payload: DevtoolsMessagePayload = data.payload;
    switch (payload?.type) {
      case FRAME_ACTIVE_CHANGE: {
        frameIsActive = payload.active;
        break;
      }
      case PANEL_CHANGE: {
        selectedPanel = payload.panel;
        break;
      }
    }
  });
}

export function listenDevtools(): void {
  window.addEventListener("message", ({ data }: MessageEvent): void => {
    if (data?.source !== MESSAGE_SOURCE_PANEL) {
      return;
    }
    const payload: DevtoolsMessagePayload = data.payload;
    switch (payload?.type) {
      case EVALUATION_EDIT: {
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
        break;
      }
      case TRANSFORMATION_EDIT: {
        const {
          data,
          transform,
          id,
          options: { from, mapArray, allowInject },
        } = payload;
        reTransformForDevtools(
          id,
          data,
          transform,
          from,
          mapArray,
          allowInject
        );
        break;
      }
    }
  });
}

export function getDevHook(): DevtoolsHook {
  return (window as DevtoolsHookContainer).__BRICK_NEXT_DEVTOOLS_HOOK__;
}

function restoreDehydrated(value: unknown): any {
  return getDevHook()?.restoreDehydrated(value) ?? value;
}
