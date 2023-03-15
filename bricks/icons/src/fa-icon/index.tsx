import React, { useEffect, useState } from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement, wrapLocalBrick } from "@next-core/react-element";
import { hasOwnProperty } from "@next-core/utils/general";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type IconDefinition, config } from "@fortawesome/fontawesome-svg-core";
import styleText from "./generated/fa-icon.shadow.css";
import alias from "./generated/alias.json";

config.autoAddCss = false;

const { defineElement, property } = createDecorators();

export interface FaIconProps {
  prefix?: string;
  icon?: string;
  spin?: boolean;
}

@defineElement("icons.fa-icon", {
  styleTexts: [styleText],
})
class FaIcon extends ReactNextElement implements FaIconProps {
  // Note: `prefix` is a native prop on Element, but it's only used in XML documents.
  @property() accessor prefix!: string;
  @property() accessor icon: string | undefined;
  @property({ type: Boolean }) accessor spin: boolean | undefined;

  render() {
    return (
      <FaIconComponent prefix={this.prefix} icon={this.icon} spin={this.spin} />
    );
  }
}

function FaIconComponent({ prefix: _prefix, icon, spin }: FaIconProps) {
  const prefix = _prefix ?? "fas";
  const [iconDefinition, setIconDefinition] = useState<IconDefinition | null>(
    null
  );

  useEffect(() => {
    async function init() {
      try {
        if (icon) {
          const actualIcon =
            hasOwnProperty(alias, prefix) &&
            hasOwnProperty((alias as Alias)[prefix], icon)
              ? (alias as Alias)[prefix][icon]
              : icon;
          setIconDefinition(
            (
              await import(
                /* webpackChunkName: "fa-icons/" */
                `./generated/icons/${prefix}/${actualIcon}.json`
              )
            ).default
          );
        } else {
          setIconDefinition(null);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("FontAwesome Icon not found:", prefix, icon);
      }
    }
    init();
  }, [icon, prefix]);

  if (!iconDefinition) {
    return null;
  }

  return <FontAwesomeIcon icon={iconDefinition} spin={spin} />;
}

interface Alias {
  [category: string]: {
    [icon: string]: string;
  };
}

export const WrappedFaIcon = wrapLocalBrick<FaIcon, FaIconProps>(FaIcon);

// Prettier reports error if place `export` before decorators.
// https://github.com/prettier/prettier/issues/14240
export { FaIcon };
