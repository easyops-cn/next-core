import { createProviderClass } from "@next-core/utils/general";

export function haveFun() {
  return "fun";
}

export function haveMoreFun(about: string, timeout = 1000) {
  return new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve(`more-${haveFun()}:${about}`);
    }, timeout);
  });
}

customElements.define("basic.have-fun", createProviderClass(haveFun));

customElements.define("basic.have-more-fun", createProviderClass(haveMoreFun));
