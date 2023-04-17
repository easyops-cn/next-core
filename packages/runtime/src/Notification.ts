import { _internalApiLoadBricks } from "./internal/Runtime.js";

let brick: {
  resolve(options: NotificationOptions): void;
};

function show(options: NotificationOptions) {
  if (brick) {
    brick.resolve(options);
  } else {
    alert(options.message);
  }
}

export function loadNotificationService(tagName: string) {
  _internalApiLoadBricks([tagName]).then(
    () => {
      brick = document.createElement(tagName) as any;
    },
    (error: unknown) => {
      // eslint-disable-next-line no-console
      console.error("Load notification service failed:", error);
    }
  );
}

export interface NotificationOptions {
  type?: "success" | "error" | "warn" | "info";
  message: string;
}

export const Notification = Object.freeze({
  show,
});
