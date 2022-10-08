import { HttpAbortError } from "@next-core/brick-http";
/** @internal */
export function isHttpAbortError(error: any): boolean {
  return error instanceof HttpAbortError;
}
