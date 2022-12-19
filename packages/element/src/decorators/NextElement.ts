export abstract class NextElement extends HTMLElement {
  static readonly styleTexts: string[] | undefined;

  #hasRequestedRender = false;
  #connectedCallbackCalled = false;

  connectedCallback() {
    this.#connectedCallbackCalled = true;
  }

  /** @internal */
  attributeChangedCallback(
    name: string,
    old: string | null,
    value: string | null
  ): void {
    if (old !== value) {
      this.#enqueueRender();
    }
  }

  // Enure multiple property settings will trigger rendering only once.
  #enqueueRender(): void {
    // If the element is not connected,
    // let `connectedCallback()` do the job of rendering.
    if (
      this.isConnected &&
      this.#connectedCallbackCalled &&
      !this.#hasRequestedRender
    ) {
      this.#hasRequestedRender = true;
      Promise.resolve().then(() => {
        this.#hasRequestedRender = false;
        this._render();
      });
    }
  }

  protected abstract _render(): void;
}
