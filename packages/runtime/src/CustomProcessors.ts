class CustomProcessorRegistry {
  readonly #registry = new Map<string, Map<string, Function>>();

  define(processorFullName: string, processorFunc: Function) {
    // `namespace` should be the camelCase of the package name.
    const [namespace, processorName] = processorFullName.split(".");
    let pkg = this.#registry.get(namespace);
    if (!pkg) {
      pkg = new Map();
      this.#registry.set(namespace, pkg);
    }
    if (pkg.has(processorName)) {
      // eslint-disable-next-line no-console
      throw new Error(
        `Custom processor of "${processorFullName}" already registered`
      );
    }
    pkg.set(processorName, processorFunc);
  }

  get(namespace: string) {
    return this.#registry.get(namespace);
  }
}

export const customProcessors = new CustomProcessorRegistry();
