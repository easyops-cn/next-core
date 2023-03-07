import React, { useEffect, useRef, useState, useCallback } from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import styleText from "./dropdown.shadow.css";
import classNames from "classnames";

const { defineElement } = createDecorators();

export interface DropdownProps {
  curElement: HTMLElement;
}
/**
 * @id basic.general-dropdown
 * @name basic.general-dropdown
 * @docKind brick
 * @description 下拉容器构件
 * @author sailor
 *
 */
@defineElement("basic.general-dropdown", {
  styleTexts: [styleText],
})
class Dropdown extends ReactNextElement {
  render() {
    return <DropdownComponent curElement={this} />;
  }
}

function DropdownComponent({ curElement }: DropdownProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const defaultRef = useRef<HTMLSlotElement>(null);
  const triggerRef = useRef<HTMLSlotElement>(null);
  const [visible, setVisible] = useState(false);

  const handleDocumentClick = useCallback(
    (e: MouseEvent) => {
      if (curElement === e.target) return;
      if (!curElement.contains(e.target as HTMLElement)) {
        setVisible(false);
      }
    },
    [curElement]
  );

  const handleTriggerClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      setVisible(!visible);
    },
    [visible]
  );

  const handleDropdownClose = () => setVisible(false);

  useEffect(() => {
    const triggerSlot = triggerRef.current;
    const defaultSlot = defaultRef.current;

    document.addEventListener("click", handleDocumentClick);
    triggerSlot?.addEventListener("click", handleTriggerClick);
    defaultSlot?.addEventListener("click", handleDropdownClose);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
      triggerSlot?.removeEventListener("click", handleTriggerClick);
      defaultSlot?.addEventListener("click", handleDropdownClose);
    };
  }, [handleDocumentClick, handleTriggerClick, visible]);

  return (
    <div className="dropdown-wrapper" ref={wrapperRef}>
      <slot name="trigger" ref={triggerRef}></slot>
      <div
        className={classNames("dropdown-content", visible ? "open" : "close")}
      >
        <slot className="default-slot" ref={defaultRef}></slot>
      </div>
    </div>
  );
}

export { Dropdown };
