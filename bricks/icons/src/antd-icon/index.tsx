import React, { Suspense, lazy } from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement, wrapLocalBrick } from "@next-core/react-element";

const { defineElement, property } = createDecorators();

export interface AntdIconInterface {
  theme: string;
  icon: string;
}

@defineElement("icons.antd-icon")
class AntdIcon extends ReactNextElement implements AntdIconInterface {
  @property() accessor theme!: string;
  @property() accessor icon!: string;

  render() {
    return <AntdIconComponent theme={this.theme} icon={this.icon} />;
  }
}

function AntdIconComponent({ theme, icon }: AntdIconInterface) {
  if (!icon) {
    return null;
  }

  const Icon = lazy(
    () =>
      import(
        /* webpackChunkName: "antd-icons/" */
        `./generated/${theme}/${icon}.svg`
      )
  );

  return (
    <Suspense>
      <Icon />
    </Suspense>
  );
}

export const WrappedAntdIcon = wrapLocalBrick<AntdIconInterface, AntdIcon>(
  AntdIcon
);
