import React, { PropsWithChildren, Ref, forwardRef } from "react";
import type { NextElement } from "@next-core/element";

interface Constructable<T> {
  prototype: T;
  new (): T;
  __tagName: string;
}

export function wrapLocalBrick<P, T extends NextElement>(
  brick: Constructable<T>
) {
  return forwardRef(function BrickReactWrapper(
    { children, ...properties }: PropsWithChildren<P>,
    ref: Ref<T>
  ) {
    const WebComponent = brick.__tagName;
    return (
      <WebComponent {...(properties as any)} ref={ref}>
        {children}
      </WebComponent>
    );
  });
}
