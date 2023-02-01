interface ProviderElement<T extends unknown[], U> extends HTMLElement {
  resolve(...args: T): U;
}

interface ProviderConstructor<T extends unknown[], U> {
  new (): ProviderElement<T, U>;
}

export function createProviderClass<T extends unknown[], U>(
  api: (...args: T) => U
): ProviderConstructor<T, U> {
  return class extends HTMLElement {
    get $$typeof(): string {
      return "provider";
    }

    resolve(...args: T): U {
      return api(...args);
    }
  };
}
