export type CustomProcessorFunc = (...args: unknown[]) => unknown;

export const customProcessorRegistry = new Map<
  string,
  Map<string, CustomProcessorFunc>
>();

export function registerCustomProcessor(
  processorFullName: string,
  processorFunc: CustomProcessorFunc
): void {
  // `namespace` should be the camelCase of the package name.
  const [namespace, processorName] = processorFullName.split(".");
  let registry = customProcessorRegistry.get(namespace);
  if (!registry) {
    registry = new Map();
    customProcessorRegistry.set(namespace, registry);
  }
  if (registry.has(processorName)) {
    // eslint-disable-next-line no-console
    throw new Error(
      `Custom processor of "${processorFullName}" already registered`
    );
  }
  registry.set(processorName, processorFunc);
}
