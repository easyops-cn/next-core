import React, { Suspense, lazy } from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement, wrapLocalBrick } from "@next-core/react-element";

const { defineElement, property } = createDecorators();

export interface AntdIconProps {
  /** Defaults to "outlined" */
  theme?: string;
  icon?: string;
}

@defineElement("icons.antd-icon")
class AntdIcon extends ReactNextElement implements AntdIconProps {
  @property() accessor theme: string | undefined;
  @property() accessor icon: string | undefined;

  render() {
    return <AntdIconComponent theme={this.theme} icon={this.icon} />;
  }
}

function AntdIconComponent({ theme: _theme, icon }: AntdIconProps) {
  const theme = _theme ?? "outlined";

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

export const WrappedAntdIcon = wrapLocalBrick<AntdIcon, AntdIconProps>(
  AntdIcon
);

// Prettier reports error if place `export` before decorators.
// https://github.com/prettier/prettier/issues/14240
export { AntdIcon };
