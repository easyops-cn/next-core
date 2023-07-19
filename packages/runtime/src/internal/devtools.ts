export const MESSAGE_SOURCE_PANEL = "brick-next-devtools-panel";
export const FRAME_ACTIVE_CHANGE = "devtools-frame-active-change";
export const PANEL_CHANGE = "devtools-panel-change";

interface DevtoolsHookContainer {
  __BRICK_NEXT_DEVTOOLS_HOOK__?: DevtoolsHook;
}

interface DevtoolsHook {
  emit: (message: unknown) => void;
}

type DevtoolsMessagePayload = FrameActiveChangePayload | PanelChangePayload;

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

export function devtoolsHookEmit(type: string, payload?: unknown): void {
  const devtools = getDevHook();
  if (
    !devtools ||
    (type === "evaluation" &&
      !(frameIsActive && (!selectedPanel || selectedPanel === "Evaluations")))
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
  // istanbul ignore next
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

export function getDevHook(): DevtoolsHook | undefined {
  return (window as DevtoolsHookContainer).__BRICK_NEXT_DEVTOOLS_HOOK__;
}
