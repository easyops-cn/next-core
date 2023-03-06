import React, { useContext, useEffect } from "react";
import type {
  GeneralIcon,
  GeneralIconProps,
} from "@next-bricks/icons/general-icon";
import { wrapBrick } from "@next-core/react-element";
import classnames from "classnames";
import useTransform from "./hooks/useTransform.js";
import { BASE_SCALE_RATIO, MAX_SCALE, MIN_SCALE } from "./previewConfig.js";
import { ImageListContext } from "./ImageListContext.js";

const WrappedIcon = wrapBrick<GeneralIcon, GeneralIconProps>(
  "icons.general-icon"
);

interface PreviewProps {
  onClose?: () => void;
  visible?: boolean;
  scaleStep?: number;
}

export const Preview = ({
  visible,
  onClose,
  scaleStep = 0.5,
}: PreviewProps) => {
  const { transform, resetTransform, updateTransform, dispatchZoomChange } =
    useTransform();

  useEffect(() => {
    if (!visible) {
      resetTransform();
    }
  }, [visible]);

  const { previewImageList, currentUUid, setCurrentUUid } =
    useContext(ImageListContext);

  const previewUUidList = previewImageList.map((v) => v.uuid);
  const currentIndex = previewUUidList.indexOf(currentUUid as number);

  const operations = [
    {
      icon: <WrappedIcon lib="antd" theme="outlined" icon="close" />,
      onClick: onClose,
      type: "close",
    },
    {
      icon: <WrappedIcon lib="antd" theme="outlined" icon="zoom-in" />,
      onClick: () => {
        dispatchZoomChange(BASE_SCALE_RATIO + scaleStep);
      },
      type: "zoom-in",
      disabled: transform.scale >= MAX_SCALE,
    },
    {
      icon: <WrappedIcon lib="antd" theme="outlined" icon="zoom-out" />,
      onClick: () => {
        dispatchZoomChange(BASE_SCALE_RATIO - scaleStep);
      },
      type: "zoom-out",
      disabled: transform.scale <= MIN_SCALE,
    },
    {
      icon: <WrappedIcon lib="antd" theme="outlined" icon="rotate-right" />,
      onClick: () => {
        updateTransform({ rotate: transform.rotate + 90 });
      },
      type: "rotate-right",
    },
    {
      icon: <WrappedIcon lib="antd" theme="outlined" icon="rotate-left" />,
      onClick: () => {
        updateTransform({ rotate: transform.rotate - 90 });
      },
      type: "rotate-left",
    },
  ];

  return (
    <div
      className="preview-root"
      style={{ visibility: visible ? "visible" : "hidden" }}
    >
      <div className="preview-mask" />
      <div className="preview-wrap">
        <div
          className="preview-image-wrap"
          onClick={(e: React.MouseEvent<HTMLDivElement>): void => {
            e.target === e.currentTarget && onClose?.();
          }}
        >
          <img
            className="preview-image"
            draggable={false}
            src={previewImageList[currentIndex]?.src}
            alt={previewImageList[currentIndex]?.alt}
            style={{
              transform: `translate3d(${transform.translateX}px, ${transform.translateY}px, 0) scale3d(${transform.scale}, ${transform.scale}, 1) rotate(${transform.rotate}deg)`,
            }}
          />
        </div>
      </div>
      <div className="preview-operations">
        <div
          className={classnames("preview-switch", "preview-switch-left", {
            "preview-switch-disabled": currentIndex <= 0,
          })}
          onClick={() => {
            const newCurrentIndex =
              currentIndex - 1 <= 0 ? 0 : currentIndex - 1;
            setCurrentUUid(previewUUidList[newCurrentIndex]);
          }}
        >
          <WrappedIcon lib="antd" theme="outlined" icon="left" />
        </div>
        <div
          className={classnames("preview-switch", "preview-switch-right", {
            "preview-switch-disabled":
              currentIndex >= previewImageList.length - 1,
          })}
          onClick={() => {
            const newCurrentIndex =
              currentIndex + 1 >= previewImageList.length - 1
                ? previewImageList.length - 1
                : currentIndex + 1;
            setCurrentUUid(previewUUidList[newCurrentIndex]);
          }}
        >
          <WrappedIcon lib="antd" theme="outlined" icon="right" />
        </div>

        <div className="preview-operations-bar">
          <div className="preview-operations-progress">{`${
            currentIndex + 1
          } / ${previewImageList.length}`}</div>
          {operations.map(({ icon, type, disabled, onClick }) => {
            return (
              <div
                data-testid={`preview-operations-button-${type}`}
                className={classnames("preview-operations-button", {
                  "preview-operations-button-disabled": !!disabled,
                })}
                onClick={onClick}
                key={type}
              >
                {icon}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
