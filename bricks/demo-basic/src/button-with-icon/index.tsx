import React from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement, wrapBrick } from "@next-core/react-element";
import type { FaIconProps, FaIcon } from "@next-bricks/icons/fa-icon";

const { defineElement, property } = createDecorators();

export interface ButtonWithIconInterface {
  lib: "antd" | "fa" | "easyops";
  icon: string;
}

const WrappedFaIcon = wrapBrick<FaIcon, FaIconProps>("icons.fa-icon");

@defineElement("demo-basic.button-with-icon")
class ButtonWithIcon
  extends ReactNextElement
  implements ButtonWithIconInterface
{
  @property() accessor lib!: ButtonWithIconInterface["lib"];
  @property() accessor icon!: string;

  render() {
    return (
      <button>
        <WrappedFaIcon prefix="regular" icon="user" />
        <slot />
      </button>
    );
  }
}
