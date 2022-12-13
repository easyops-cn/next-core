declare const __webpack_init_sharing__: (scope: string) => Promise<unknown>;
declare const __webpack_share_scopes__: Record<string, unknown>;

interface WebpackRuntimeContainer {
  init(arg: unknown): Promise<unknown>;
  get(module: string): Promise<Function>;
}

// https://github.com/module-federation/module-federation-examples/blob/eda9493f3991a423479fd834cfb1d7b241d9d1f0/advanced-api/dynamic-remotes/app1/src/App.js
export async function loadBrick(scope: string, module: string) {
  // Initializes the share scope. This fills it with known provided modules from this build and all remotes
  await __webpack_init_sharing__("default");
  const container = (window as unknown as Record<string, unknown>)[
    scope
  ] as WebpackRuntimeContainer; // or get the container somewhere else
  // Initialize the container, it may provide shared modules
  await container.init(__webpack_share_scopes__.default);
  const factory = await container.get(module);
  return factory();
}
