import { pipes } from "@easyops-cn/brick-next-pipes";
import { crontabFormat } from "./crontabFormat";

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
PipeRegistry.set("crontabFormat", (value: unknown): unknown => {
  return crontabFormat(value as string);
});
/** For next-core internal usage only. */
export function processPipes(value: unknown, pipes: PipeCall[]): unknown {
  if (pipes.length === 0) {
    return value;
  }
  let result = value;
  for (const pipe of pipes) {
    if (!PipeRegistry.has(pipe.identifier)) {
      // eslint-disable-next-line no-console
      console.warn(`Unknown pipe: ${pipe.identifier}`);
      return;
    }
    result = PipeRegistry.get(pipe.identifier)(result, ...pipe.parameters);
  }
  return result;
}
