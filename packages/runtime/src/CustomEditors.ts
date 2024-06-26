class CustomEditorRegistry {
  readonly #registry = new Map<string, Function>();

  define(editorName: string, editorFunc: Function) {
    if (this.#registry.has(editorName)) {
      // eslint-disable-next-line no-console
      console.error(`Custom editor of "${editorName}" already registered`);
      return;
    }

    this.#registry.set(editorName, editorFunc);
  }

  get(editorName: string) {
    return this.#registry.get(editorName);
  }
}

export const customEditors = new CustomEditorRegistry();
