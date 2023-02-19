import { pipes } from "@easyops-cn/brick-next-pipes";

export { pipes, utils } from "@easyops-cn/brick-next-pipes";

type PipeFunction = (...args: unknown[]) => unknown;

export interface PipeCall extends Node {
  type: "PipeCall";
  identifier: string;
  parameters: any[];
}

export interface Node {
  type: string;
  loc?: SourceLocation;
}

export interface SourceLocation {
  start: number;
  end: number;
}

const PipeRegistry = new Map<string, PipeFunction>(
  Array.from(Object.entries(pipes as Record<string, PipeFunction>))
);

/** For next-core internal usage only. */
export function processPipes(value: unknown, pipes: PipeCall[]): unknown {
  if (pipes.length === 0) {
    return value;
  }
  let result = value;
  for (const pipe of pipes) {
    const registeredPipe = PipeRegistry.get(pipe.identifier);
    if (!registeredPipe) {
      // eslint-disable-next-line no-console
      console.warn(`Unknown pipe: ${pipe.identifier}`);
      return;
    }
    result = registeredPipe(result, ...pipe.parameters);
  }
  return result;
}
