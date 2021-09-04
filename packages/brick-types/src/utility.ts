export type SimpleFunction<P extends unknown[] = unknown[], R = unknown> = (
  ...args: P
) => R;
