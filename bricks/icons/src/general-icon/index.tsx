import React from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import { AntdIconProps, WrappedAntdIcon } from "../antd-icon/index.js";
import { EasyOpsIconProps, WrappedEasyOpsIcon } from "../easyops-icon/index.js";
import { FaIconProps, WrappedFaIcon } from "../fa-icon/index.js";

const { defineElement, property } = createDecorators();

export interface GeneralIconPropsOfAntd extends AntdIconProps {
  lib: "antd";
}

export interface GeneralIconPropsOfEasyOps extends EasyOpsIconProps {
  lib: "easyops";
}

export interface GeneralIconPropsOfFa extends FaIconProps {
  lib: "fa";
}

export type GeneralIconProps =
  | GeneralIconPropsOfAntd
  | GeneralIconPropsOfEasyOps
  | GeneralIconPropsOfFa;

export interface GeneralIconEvents {
  "icon.click": CustomEvent<{ icon: string }>;
}

@defineElement("icons.general-icon")
class GeneralIcon extends ReactNextElement {
  @property() accessor lib: "antd" | "easyops" | "fa" | undefined;
  @property() accessor theme: string | undefined;
  @property() accessor icon: string | undefined;
  @property() accessor category: string | undefined;
  // Note: `prefix` is a native prop on Element, but it's only used in XML documents.
  @property() accessor prefix!: string;

  render() {
    return this.lib === "antd" ? (
      <WrappedAntdIcon theme={this.theme} icon={this.icon} />
    ) : this.lib === "easyops" ? (
      <WrappedEasyOpsIcon category={this.category} icon={this.icon} />
    ) : this.lib === "fa" ? (
      <WrappedFaIcon prefix={this.prefix} icon={this.icon} />
    ) : null;
  }
}

// Prettier reports error if place `export` before decorators.
// https://github.com/prettier/prettier/issues/14240
export { GeneralIcon };
