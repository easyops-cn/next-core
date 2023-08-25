import type { HttpError } from "./http.js";

export interface InterceptorHandlers<T, C = never> {
  fulfilled?: (value: T, config: C) => T | Promise<T>;
  rejected?: (error: HttpError, config: C) => HttpError | Promise<HttpError>;
}

export default class InterceptorManager<T, C = never> {
  handlers: (InterceptorHandlers<T, C> | null)[] = [];

  use(
    onFulfilled?: (value: T, config: C) => T | Promise<T>,
    onRejected?: (error: HttpError, config: C) => HttpError | Promise<HttpError>
  ): number {
    this.handlers.push({
      fulfilled: onFulfilled,
      rejected: onRejected,
    });

    return this.handlers.length - 1;
  }

  eject(id: number): void {
    // istanbul ignore else
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  forEach(fn: (h: InterceptorHandlers<T, C>) => void): void {
    this.handlers.forEach((handler) => {
      // istanbul ignore else
      if (handler !== null) {
        fn(handler);
      }
    });
  }
}
