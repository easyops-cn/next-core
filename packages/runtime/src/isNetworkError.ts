import { HttpFetchError } from "@next-core/http";
import { BrickLoadError } from "@next-core/loader";

export function isNetworkError(error: unknown): boolean {
  return (
    !!error &&
    (error instanceof BrickLoadError ||
      error instanceof HttpFetchError ||
      (error instanceof Error && error.name === "ChunkLoadError") ||
      (error instanceof Event &&
        error.type === "error" &&
        error.target instanceof HTMLScriptElement))
  );
}
