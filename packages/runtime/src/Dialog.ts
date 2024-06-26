let brick: {
  resolve(options: DialogOptions): Promise<void>;
};

function show(options: DialogOptions): Promise<void> {
  if (brick) {
    return brick.resolve(options);
  } else {
    if (options.type === "confirm") {
      const confirmed = confirm(options.content);
      return new Promise((resolve, reject) =>
        setTimeout(() => {
          (confirmed ? resolve : reject)();
        }, 1)
      );
    } else {
      alert(options.content);
      return new Promise((resolve) =>
        setTimeout(() => {
          resolve();
        }, 1)
      );
    }
  }
}

export function loadDialogService(
  tagName: string,
  loader: (bricks: string[]) => Promise<void>
) {
  loader([tagName]).then(
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
  contentStyle?: object;
}

export const Dialog = Object.freeze({
  show,
});
