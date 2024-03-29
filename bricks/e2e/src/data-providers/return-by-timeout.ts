import { createProviderClass } from "@next-core/utils/general";

function returnByTimeout(timeout: number, result: unknown) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(result);
    }, timeout);
  });
}

customElements.define(
  "e2e.return-by-timeout",
  createProviderClass(returnByTimeout)
);
