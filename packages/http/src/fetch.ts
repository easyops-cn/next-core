export const fetch = (
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> => {
  // Support older browsers which default credentials is "omit".
  // Ref https://github.com/whatwg/fetch/pull/585
  const req = new Request(
    window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__
      ? typeof input === "string"
        ? new URL(input, window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__).toString()
        : {
            ...input,
            url: new URL(input.url, window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__).toString(),
          }
      : input,
    Object.assign<RequestInit, RequestInit | undefined>(
      {
        credentials: window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__ ? "include" : "same-origin",
      },
      init
    )
  );

  return self.fetch(req);
};
