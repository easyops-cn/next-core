function CustomEditorRegistry() {
  // eslint-disable-next-line @typescript-eslint/ban-types
  const registry = new Map<string, Function>();
  return {
    // eslint-disable-next-line @typescript-eslint/ban-types
    define(editorName: string, editorFunc: Function): void {
      if (registry.has(editorName)) {
        throw new Error(`Custom editor of "${editorName}" already registered`);
      }

      registry.set(editorName, editorFunc);
    },
    // eslint-disable-next-line @typescript-eslint/ban-types
    get(editorName: string): Function {
      return registry.get(editorName);
    },
  };
}

export const customEditors = CustomEditorRegistry();
