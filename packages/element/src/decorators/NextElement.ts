import type { AttributeReflection } from "./interfaces.js";

export abstract class NextElement extends HTMLElement {
  static readonly styleTexts: string[] | undefined;
  static readonly __attributeReflections: Map<string, AttributeReflection>;

  #hasRequestedRender = false;
  #connectedCallbackCalled = false;
  #attributeChangedCallbackStopped = false;
  #attributesBeenSet = new Set<string>();

  connectedCallback() {
    this.#connectedCallbackCalled = true;
  }

  __attributeHasBeenSet(name: string): boolean {
    return this.#attributesBeenSet.has(name);
  }

  /** Whether to stop reflecting attribute back to property. */
  __stopAttributeChangedCallback(value: boolean): void {
    this.#attributeChangedCallbackStopped = value;
  }

  /** @internal */
  attributeChangedCallback(
    name: string,
    old: string | null,
    value: string | null
  ): void {
    this.#attributesBeenSet.add(name);
    if (!this.#attributeChangedCallbackStopped && old !== value) {
      const attrRef = (
        this.constructor as typeof NextElement
      ).__attributeReflections.get(name);
      assertAttributeIsReflected(attrRef, name);
      const oldProp = (this as any)[attrRef.property];
      const newProp = attrRef.converter.fromAttribute(value, attrRef.type);
      if (attrRef.hasChanged(newProp, oldProp)) {
        (this as any)[attrRef.property] = newProp;
      }
    }
  }

  // Ensure multiple property updates will trigger rendering only once.
  _requestRender(): void {
    // If the element is not connected,
    // let `connectedCallback()` do the job of calling _render.
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

function assertAttributeIsReflected(
  attrRef: AttributeReflection | undefined,
  name: string
): asserts attrRef is AttributeReflection {
  if (process.env.NODE_ENV === "development" && !attrRef) {
    throw new Error(`Attribute [${name}] is not reflected`);
  }
}
