import pipes from "./pipes";

type PipeFunction = (...args: unknown[]) => unknown;

export const PipeRegistry = new Map<string, PipeFunction>(
  Array.from(Object.entries(pipes as Record<string, PipeFunction>))
);
