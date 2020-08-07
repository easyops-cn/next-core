type CustomProcessorFunc = (...args: any[]) => any;

export const customProcessorRegistry = new Map<string, CustomProcessorFunc>();

export function registerCustomProcessor(
  processorName: string,
  processorFunc: CustomProcessorFunc
): void {
  if (customProcessorRegistry.has(processorName)) {
    // eslint-disable-next-line no-console
    throw new Error(
      `Custom processor of "${processorName}" already registered`
    );
  }
  customProcessorRegistry.set(processorName, processorFunc);
}
