export abstract class UpdatingElement extends HTMLElement {
  private _hasRequestedRender = false;

  /** @internal */
  attributeChangedCallback(
    name: string,
    old: string | null,
    value: string | null
  ): void {
    if (old !== value) {
      this._enqueueRender();
    }
  }

  // Enure multiple property settings will trigger rendering only once.
  private _enqueueRender(): void {
    // If the element is not connected,
    // let `connectedCallback()` do the job of rendering.
    if (this.isConnected && !this._hasRequestedRender) {
      this._hasRequestedRender = true;
      // console.log("_enqueueRender");
      Promise.resolve().then(() => {
        this._hasRequestedRender = false;
        // console.log("_enqueueRender callback");
        this._render();
      });
    }
  }

  protected abstract _render(): void;
}
