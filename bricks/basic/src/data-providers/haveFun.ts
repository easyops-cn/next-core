function createProviderClass<T extends unknown[], U>(api: (...args: T) => U) {
  return class extends HTMLElement {
    get $$typeof(): string {
      return "provider";
    }

    static get _dev_only_definedProperties(): string[] {
      return ["args"];
    }

    resolve(...args: T): U {
      return api(...args);
    }
  };
}

export function haveFun() {
  return "fun";
}

export function haveMoreFun() {
  return `more-${haveFun()}`;
}

customElements.define("basic.have-fun", createProviderClass(haveFun));

customElements.define("basic.have-more-fun", createProviderClass(haveMoreFun));
