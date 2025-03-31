/* eslint-disable no-console */
import { computeRealValue } from "./compute/computeRealValue.js";

export function perf<T = unknown>(
  callback: () => T,
  label: string,
  info: unknown
): T {
  const start = performance.now();
  const result = callback();
  const end = performance.now();
  const cost = Math.round(end - start);
  if (cost > 100) {
    console.log(`Execution time: ${cost}ms for ${label}:`);
    console.log(info);
  }
  return result;
}

export async function asyncPerf<T = unknown>(
  callback: () => Promise<T>,
  label: string,
  info: unknown
): Promise<T> {
  const start = performance.now();
  const result = await callback();
  const end = performance.now();
  const cost = Math.round(end - start);
  if (cost > 100) {
    console.log(`Execution time: ${cost}ms for ${label}:`);
    console.log(info);
  }
  return result;
}

export function wrapComputeRealValue(
  ...args: Parameters<typeof computeRealValue>
): ReturnType<typeof computeRealValue> {
  return perf(() => computeRealValue(...args), "computeRealValue", args[0]);
}
