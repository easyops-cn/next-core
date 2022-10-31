import { getAuth } from "@next-core/brick-kit";

declare global {
  interface XMLHttpRequest {
    origOpen(method: string, url: string | URL): void;
    origOpen(
      method: string,
      url: string | URL,
      async: boolean,
      username?: string | null,
      password?: string | null
    ): void;
  }
}

XMLHttpRequest.prototype.origOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function () {
  // eslint-disable-next-line prefer-spread, prefer-rest-params
  this.origOpen.apply(this, arguments);
  const csrfToken = getAuth().csrfToken;

  if (csrfToken) {
    this.setRequestHeader("X-CSRF-Token", csrfToken);
  }
};
