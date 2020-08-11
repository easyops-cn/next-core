import { PipeRegistry } from "./PipeRegistry";
import { PipeCall } from "./interfaces";

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
