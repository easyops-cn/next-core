import { isNetworkError } from "./isNetworkError.js";

const STORAGE_KEY = "reload-for-error-count";
const MAX_RELOAD_COUNT = 2;

export function shouldReloadForError(error: unknown): boolean {
  if (/upchat/i.test(navigator.userAgent) && isNetworkError(error)) {
    const count = +(sessionStorage.getItem(STORAGE_KEY) ?? 0);
    if (count < MAX_RELOAD_COUNT) {
      sessionStorage.setItem(STORAGE_KEY, String(count + 1));
      return true;
    }
    resetReloadForError();
  }
  return false;
}

export function resetReloadForError() {
  sessionStorage.removeItem(STORAGE_KEY);
}
