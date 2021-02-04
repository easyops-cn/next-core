export enum LogLevel {
  DEFAULT = 0,
  VERBOSE = 1,
}

let currentLogLevel = LogLevel.DEFAULT;

export function setLogLevel(logLevel: LogLevel): void {
  currentLogLevel = logLevel;
}

type AbstractCustomConsole = Record<
  keyof Console,
  (logLevel: LogLevel, ...args: unknown[]) => unknown
>;

export const customConsole = new Proxy<AbstractCustomConsole>(console as any, {
  get: (target, prop) =>
    typeof target[prop] === "function"
      ? (level: LogLevel, ...args: unknown[]) => {
          if (currentLogLevel >= level) {
            (target as any)[prop](...args);
          }
        }
      : /* istanbul ignore next */ target[prop],
});
