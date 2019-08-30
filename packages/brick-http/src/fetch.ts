export type Interceptor = (
  req: Request,
  next: NextInterceptor,
  extra?: any
) => Promise<Response>;

export type NextInterceptor = (req: Request) => Promise<Response>;

export type RemoveInterceptor = () => void;

const interceptors: Interceptor[] = [];

export const fetch = (
  input: RequestInfo,
  init?: RequestInit,
  interceptorParams?: any
): Promise<Response> => {
  // Support older browsers which default credentials is "omit".
  // Ref https://github.com/whatwg/fetch/pull/585
  const req = new Request(
    input,
    Object.assign<RequestInit, RequestInit>(
      {
        credentials: "same-origin"
      },
      init
    )
  );
  let last = (req: Request): Promise<Response> => self.fetch(req);
  for (const inter of interceptors.slice().reverse()) {
    const next: NextInterceptor = last;
    last = req => inter(req, next, interceptorParams);
  }
  return last(req);
};

export const pushInterceptor = (
  interceptor: Interceptor
): RemoveInterceptor => {
  interceptors.push(interceptor);
  return () => {
    if (interceptors.includes(interceptor)) {
      interceptors.splice(interceptors.indexOf(interceptor), 1);
    }
  };
};
