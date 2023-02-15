import React, { Suspense, lazy } from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement, wrapLocalBrick } from "@next-core/react-element";

const { defineElement, property } = createDecorators();

export interface EasyOpsIconProps {
  category?: string;
  icon?: string;
}

@defineElement("icons.easyops-icon")
class EasyOpsIcon extends ReactNextElement implements EasyOpsIconProps {
  @property() accessor category: string | undefined;
  @property() accessor icon: string | undefined;

  render() {
    return <EasyOpsIconComponent category={this.category} icon={this.icon} />;
  }
}

function EasyOpsIconComponent({ category: _category, icon }: EasyOpsIconProps) {
  const category = _category ?? "default";

  if (!icon) {
    return null;
  }

  const Icon = lazy(
    () =>
      import(
        /* webpackChunkName: "easyops-icons/" */
        `./generated/${category}/${icon}.svg`
      )
  );

  return (
    <Suspense>
      <Icon />
    </Suspense>
  );
}

export const WrappedEasyOpsIcon = wrapLocalBrick<EasyOpsIcon, EasyOpsIconProps>(
  EasyOpsIcon
);

// Prettier reports error if place `export` before decorators.
// https://github.com/prettier/prettier/issues/14240
export { EasyOpsIcon };
