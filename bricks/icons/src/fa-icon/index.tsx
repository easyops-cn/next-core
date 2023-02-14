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

export interface FaIconInterface {
  prefix: string;
  icon: string;
  beat?: boolean;
}

@defineElement("icons.fa-icon", {
  styleTexts: [styleText],
})
class FaIcon extends ReactNextElement implements FaIconInterface {
  @property() accessor prefix!: string;
  @property() accessor icon!: string;
  @property({ type: Boolean }) accessor beat: boolean | undefined;

  render() {
    return (
      <FaIconComponent prefix={this.prefix} icon={this.icon} beat={this.beat} />
    );
  }
}

function FaIconComponent({ prefix, icon, beat }: FaIconInterface) {
  const [iconDefinition, setIconDefinition] = useState<IconDefinition | null>(
    null
  );

  useEffect(() => {
    async function init() {
      try {
        if (prefix && icon) {
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

  return <FontAwesomeIcon icon={iconDefinition} beat={beat} />;
}

interface Alias {
  [category: string]: {
    [icon: string]: string;
  };
}

export const WrappedFaIcon = wrapLocalBrick<FaIconInterface, FaIcon>(FaIcon);
