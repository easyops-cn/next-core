/** @internal */
export const abortController = (() => {
  const supported = "AbortController" in window;

  if (!supported) {
    return {
      abortPendingRequest() {
        // Do nothing
      },
      getSignalToken(): null {
        return null;
      },
    };
  }

  let controller = new AbortController();
  let signal = controller.signal;
  const abortPendingRequest = () => {
    controller.abort();
    controller = new AbortController();
    signal = controller.signal;
  };

  const getSignalToken = (): AbortSignal => signal;

  return {
    abortPendingRequest,
    getSignalToken,
  };
})();
