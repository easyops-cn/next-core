import { PipeRegistry } from "./PipeRegistry";

export function processPipes(value: any, rawPipes: string): any {
  if (!rawPipes) {
    return value;
  }
  const matches = rawPipes.match(/\|(?:[^|]+)/g);
  const pipes = matches.map(match => match.substr(1));
  let result = value;
  for (const pipe of pipes) {
    if (!PipeRegistry.has(pipe)) {
      // eslint-disable-next-line no-console
      console.warn(`Unknown pipe: ${pipe}`);
      return;
    }
    result = PipeRegistry.get(pipe)(result);
  }
  return result;
}
