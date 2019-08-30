import { HttpResponseError } from "@easyops/brick-http";

export function isUnauthenticatedError(error: any): boolean {
  return (
    error instanceof HttpResponseError &&
    error.response.status === 401 &&
    !!error.responseJson &&
    error.responseJson.code === 100003
  );
}
