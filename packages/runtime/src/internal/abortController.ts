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
        ...config.options,
        signal: config.options?.noAbortOnRouteChange
          ? null
          : nativeController.signal,
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
