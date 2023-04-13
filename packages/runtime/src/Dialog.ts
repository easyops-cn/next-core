import * as __secret_internals from "./internal/secret_internals.js";

let brick: {
  resolve(options: DialogOptions): void;
};

function show(options: DialogOptions) {
  if (brick) {
    brick.resolve(options);
  } else {
    if (options.type === "confirm") {
      if (confirm(options.content)) {
        setTimeout(() => {
          options.onOk?.();
        }, 1);
      } else {
        setTimeout(() => {
          options.onCancel?.();
        }, 1);
      }
    } else {
      alert(options.content);
      if (options.onOk) {
        setTimeout(() => {
          options.onOk!();
        }, 1000);
      }
    }
  }
}

export function loadDialogService(tagName: string) {
  __secret_internals.loadBricks([tagName]).then(
    () => {
      brick = document.createElement(tagName) as any;
    },
    (error: unknown) => {
      // eslint-disable-next-line no-console
      console.error("Load dialog service failed:", error);
    }
  );
}

export interface DialogOptions {
  type?: "success" | "error" | "warn" | "info" | "confirm";
  title?: string | null;
  content: string;
  whiteSpace?: string;
  onOk?: () => void;
  onCancel?: () => void;
}

export const Dialog = Object.freeze({
  show,
});
