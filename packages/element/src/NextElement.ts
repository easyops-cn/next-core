import type { AttributeReflection } from "./interfaces.js";
import {
  symbolOfAttributeHasBeenSet,
  symbolOfStopAttributeChangedCallback,
} from "./internal/symbols.js";

export abstract class NextElement extends HTMLElement {
  static readonly styleTexts: string[] | undefined;
  static readonly __attributeReflections: Map<string, AttributeReflection>;
  static readonly __tagName: string;

  #hasRequestedRender = false;
  #connectedCallbackCalled = false;
  #attributeChangedCallbackStopped = false;
  #attributesBeenSet = new Set<string>();

  /**
   * When render a custom element as parsed DOM, it is already connected in the
   * first place. The attributes are set while isConnected is true, which will
   * trigger a render request, and then before the next micro-task, the
   * `connectedCallback` will be called, which will trigger an immediate render.
   * Thus we would see two calls of render. So we manually set a mark of whether
   * the `connectedCallback` is actually get called, to prevent a trigger of
   * render request during attributes initialization before `connectedCallback`.
   */
  protected _markConnectedCallbackCalled() {
    this.#connectedCallbackCalled = true;
  }

  connectedCallback() {
    this._markConnectedCallbackCalled();
    this._render();
  }

  [symbolOfAttributeHasBeenSet](name: string): boolean {
    return this.#attributesBeenSet.has(name);
  }

  /** Whether to process attributeChangedCallback. */
  [symbolOfStopAttributeChangedCallback](value: boolean): void {
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
      const propValue = attrRef.converter.fromAttribute(value, attrRef.type);
      (this as any)[attrRef.property] = propValue;
    }
  }

  /**
   * Request a render in the next micro-task. This ensures multiple properties
   * or attributes will trigger a render once in a batch.
   */
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
  // istanbul ignore next
  if (process.env.NODE_ENV === "development" && !attrRef) {
    throw new Error(`Attribute [${name}] is not reflected`);
  }
}
