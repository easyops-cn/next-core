import type { HttpError } from "./http.js";

export interface InterceptorHandlers<T> {
  fulfilled?: (config: T) => void;
  rejected?: (error: HttpError) => void;
}

export default class InterceptorManager<T> {
  handlers: (InterceptorHandlers<T> | null)[] = [];

  use(
    onFulfilled?: (value: T) => T | Promise<T>,
    onRejected?: (error: HttpError) => HttpError | Promise<HttpError>
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

  forEach(fn: (h: InterceptorHandlers<T>) => void): void {
    this.handlers.forEach((handler) => {
      // istanbul ignore else
      if (handler !== null) {
        fn(handler);
      }
    });
  }
}
