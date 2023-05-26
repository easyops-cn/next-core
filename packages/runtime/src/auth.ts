// istanbul ignore file
// Todo(steve): This file will be removed in the future.
import { hooks } from "./internal/Runtime.js";

/** @deprecated import it from "@next-core/easyops-runtime" instead */
export function authenticate(...args: unknown[]): void {
  hooks?.auth?.authenticate?.(...args);
}

/** @deprecated import it from "@next-core/easyops-runtime" instead */
export function getAuth() {
  return hooks?.auth?.getAuth();
}

/** @deprecated import it from "@next-core/easyops-runtime" instead */
export function logout() {
  return hooks?.auth?.logout?.();
}

/** @deprecated import it from "@next-core/easyops-runtime" instead */
export function isLoggedIn() {
  return hooks?.auth?.isLoggedIn();
}
