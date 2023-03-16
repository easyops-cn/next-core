import React from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement, wrapBrick } from "@next-core/react-element";
import styleText from "./tab-item.shadow.css";
import classNames from "classnames";
import type {
  GeneralIcon,
  GeneralIconProps,
} from "@next-bricks/icons/general-icon";

const { defineElement, property } = createDecorators();

export interface TabItemProps {
  text?: string;
  panel: string;
  icon?: GeneralIconProps;
  disabled?: boolean;
  hidden?: boolean;
  active?: boolean;
}

const WrappedIcon = wrapBrick<GeneralIcon, GeneralIconProps>(
  "icons.general-icon"
);

/**
 * @id containers.tab-item
 * @name containers.tab-item
 * @docKind brick
 * @description tab子项构件
 * @author sailorshe
 *
 */
@defineElement("containers.tab-item", {
  styleTexts: [styleText],
})
class TabItem extends ReactNextElement {
  /**
   * @default
   * @required
   * @description 面板名称
   */
  @property()
  accessor panel: string;

  /**
   * @default
   * @required
   * @description 图标
   */
  @property({
    attribute: false,
  })
  accessor icon: GeneralIconProps;

  /**
   * @default
   * @required
   * @description 是否禁用
   */
  @property({
    type: Boolean,
  })
  accessor disabled: boolean;

  /**
   * @default
   * @required
   * @description 是否激活状态
   */
  @property({
    type: Boolean,
  })
  accessor active: boolean;

  render() {
    return (
      <TabItemElement
        panel={this.panel}
        icon={this.icon}
        disabled={this.disabled}
        hidden={this.hidden}
        active={this.active}
      />
    );
  }
}

function TabItemElement({
  panel,
  icon,
  disabled,
  hidden,
  active,
}: TabItemProps): React.ReactElement {
  const handleTabSelect = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  };

  return (
    <div
      className={classNames("tab-item", {
        disabled,
      })}
      key={panel}
      hidden={hidden}
      aria-selected={active}
      onClick={handleTabSelect}
    >
      {icon && <WrappedIcon className="tab-item-icon" {...icon} />}
      <slot />
    </div>
  );
}

export { TabItem };
