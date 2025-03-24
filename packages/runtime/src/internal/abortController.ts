import { http } from "@next-core/http";

let nativeController: AbortController;

export function initAbortController() {
  if (!window.AbortController) {
    return;
  }

  nativeController = new AbortController();

  http.interceptors.request.use((config) => {
    return {
      ...config,
      options: {
        // Allow user config to override the default abort signal
        signal: config.options?.noAbortOnRouteChange
          ? null
          : nativeController.signal,
        ...config.options,
      },
    };
  });
}

export function abortPendingRequest() {
  if (nativeController) {
    nativeController.abort();
    nativeController = new AbortController();
  }
}
