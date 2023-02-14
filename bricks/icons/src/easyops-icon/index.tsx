import React, { Suspense, lazy } from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement, wrapLocalBrick } from "@next-core/react-element";

const { defineElement, property } = createDecorators();

export interface EasyOpsIconInterface {
  category?: string;
  icon: string;
}

@defineElement("icons.easyops-icon")
class EasyOpsIcon extends ReactNextElement implements EasyOpsIconInterface {
  @property() accessor category: string | undefined;
  @property() accessor icon!: string;

  render() {
    return <EasyOpsIconComponent category={this.category} icon={this.icon} />;
  }
}

function EasyOpsIconComponent({
  category: _category,
  icon,
}: EasyOpsIconInterface) {
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

export const WrappedEasyOpsIcon = wrapLocalBrick<
  EasyOpsIconInterface,
  EasyOpsIcon
>(EasyOpsIcon);
