import { HttpResponseError } from "@next-core/brick-http";

export function isUnauthenticatedError(error: any): boolean {
  return (
    error instanceof HttpResponseError &&
    error.response.status === 401 &&
    !!error.responseJson &&
    error.responseJson.code === 100003
  );
}
