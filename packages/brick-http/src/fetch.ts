export const fetch = (
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> => {
  // Support older browsers which default credentials is "omit".
  // Ref https://github.com/whatwg/fetch/pull/585
  const req = new Request(
    input,
    Object.assign<RequestInit, RequestInit>(
      {
        credentials: "same-origin",
      },
      init
    )
  );

  return self.fetch(req);
};
