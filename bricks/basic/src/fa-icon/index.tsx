import React from "react";
import classNames from "classnames";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import "./fontawesome-free/css/font-faces.css";
import styleText1 from "./fontawesome-free/css/fontawesome.shadow.css";
import styleText2 from "./fontawesome-free/css/regular.shadow.css";
import styleText3 from "./fontawesome-free/css/solid.shadow.css";
import styleText4 from "./fontawesome-free/css/brands.shadow.css";

const { defineElement, property } = createDecorators();

export type FaIconPrefix = "regular" | "solid" | "brands";
export type FaIconSize = "2xs" | "xs" | "sm" | "lg" | "xl" | "2xl";
export type FaIconScale = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface FaIconProps {
  prefix: FaIconPrefix;
  icon: string;
  size?: FaIconSize;
  scale?: FaIconScale;
  fixedWidth?: boolean;
  beat?: boolean;
  fade?: boolean;
  bounce?: boolean;
  flip?: boolean;
  shake?: boolean;
  spin?: boolean;
}

@defineElement("basic.fa-icon", {
  styleTexts: [styleText1, styleText2, styleText3, styleText4],
})
class FaIcon extends ReactNextElement implements FaIconProps {
  @property() accessor prefix!: FaIconPrefix;
  @property() accessor icon!: string;
  @property() accessor size: FaIconSize | undefined;
  @property({ type: Number }) accessor scale: FaIconScale | undefined;
  @property({ type: Boolean }) accessor fixedWidth: boolean | undefined;
  @property({ type: Boolean }) accessor beat: boolean | undefined;
  @property({ type: Boolean }) accessor fade: boolean | undefined;
  @property({ type: Boolean }) accessor bounce: boolean | undefined;
  @property({ type: Boolean }) accessor flip: boolean | undefined;
  @property({ type: Boolean }) accessor shake: boolean | undefined;
  @property({ type: Boolean }) accessor spin: boolean | undefined;

  render() {
    return (
      <i
        className={classNames(
          `fa-${this.prefix}`,
          `fa-${this.icon}`,
          this.size && `fa-${this.size}`,
          this.scale && `fa-${this.scale}x`,
          {
            "fa-fw": this.fixedWidth,
            "fa-beat": this.beat && !this.fade,
            "fa-fade": this.fade && !this.beat,
            "fa-beat-fade": this.beat && this.fade,
            "fa-bounce": this.bounce,
            "fa-flip": this.flip,
            "fa-shake": this.shake,
            "fa-spin": this.spin,
          }
        )}
      ></i>
    );
  }
}

export { FaIcon };
