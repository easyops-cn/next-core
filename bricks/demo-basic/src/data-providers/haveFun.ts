import { createProviderClass } from "@next-core/utils/general";

let count = 0;

export function haveFun() {
  return "fun";
}

export function haveMoreFun(about: string, timeout = 1000) {
  return new Promise<string>((resolve) => {
    window.dispatchEvent(new Event("request.start"));
    setTimeout(() => {
      window.dispatchEvent(new Event("request.end"));
      resolve(`more-${haveFun()}-${count++}:${about}`);
    }, timeout);
  });
}

customElements.define("demo-basic.have-fun", createProviderClass(haveFun));

customElements.define(
  "demo-basic.have-more-fun",
  createProviderClass(haveMoreFun)
);
