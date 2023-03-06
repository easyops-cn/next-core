import React, { useContext, useEffect, useMemo } from "react";
import type {
  GeneralIcon,
  GeneralIconProps,
} from "@next-bricks/icons/general-icon";
import { wrapBrick } from "@next-core/react-element";
import useImage from "./hooks/useImage.js";
import { ImageListContext } from "./ImageListContext.js";

let uuid = 0;

const defaultErrorSVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" style="background: rgb(238, 240, 244);"><g transform="translate(-12, -12)"><svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" color="current" x="160" y="90"><g fill="currentColor" fill-rule="nonzero"><path d="M21.042 2.11c1.19 0 2.156.966 2.156 2.156v15.288c0 1.19-.966 2.156-2.156 2.156H2.925a2.157 2.157 0 0 1-2.156-2.156V4.266c0-1.192.965-2.157 2.156-2.157h18.117Zm0 1.5H2.925a.656.656 0 0 0-.656.656v15.288c0 .361.294.656.656.656h18.117a.657.657 0 0 0 .656-.656V4.266a.657.657 0 0 0-.656-.657Z" style="&#10;  fill: #9FAECF;&#10;"/><path d="M9.516 5.344a2.298 2.298 0 1 1-.002 4.595 2.298 2.298 0 0 1 .002-4.595ZM19.847 18.117H4.123a.469.469 0 0 1-.406-.703l1.868-4.453c.722-1.25 2.527-1.25 3.249 0l.864 1.5a.938.938 0 0 0 1.657-.063l2.818-5.87c.51-1.063 2.027-1.063 2.536.003l3.56 8.916c.15.31-.078.67-.422.67Z" style="&#10;  fill: #57689C;&#10;"/></g></svg></g></svg>';
const defaultErrorBase64 = `data:image/svg+xml;base64,${window.btoa(
  defaultErrorSVG
)}`;

export interface ImageComponentProps {
  index: number;
  src?: string;
  fallback?: string;
  placeholder?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  preview?: boolean;
  onClick?: (uuid: number, preview: boolean) => void;
}

const WrappedIcon = wrapBrick<GeneralIcon, GeneralIconProps>(
  "icons.general-icon"
);

export function ImageComponent({
  index,
  src,
  fallback,
  placeholder,
  alt,
  width,
  height,
  style,
  onClick,
  preview = true,
}: ImageComponentProps) {
  const srcList = useMemo(
    () => [src, fallback, defaultErrorBase64] as string[],
    [src, fallback]
  );
  const { status, src: validSrc } = useImage(srcList);

  const [currentId] = React.useState<number>(++uuid);
  const { registerImage } = useContext(ImageListContext);

  useEffect(() => {
    const unRegister = registerImage(currentId, {
      uuid: currentId,
      src: validSrc,
      preview,
      index,
      alt,
    });

    return unRegister;
  }, []);

  useEffect(() => {
    registerImage(currentId, {
      uuid: currentId,
      src: validSrc,
      preview,
      index,
      alt,
    });
  }, [validSrc, preview, alt, index]);

  return (
    <>
      <div
        className="image-wrapper"
        onClick={() => onClick?.(currentId, preview)}
        style={{
          width,
          height,
        }}
      >
        <img
          className="image"
          src={validSrc}
          alt={alt}
          width={width}
          height={height}
          style={style}
        />

        {status === "loading" && (
          <div aria-hidden="true" className="image-placeholder">
            {placeholder}
          </div>
        )}

        {!!preview && (
          <div className="image-mask">
            <div className="image-mask-info">
              <WrappedIcon
                lib="antd"
                theme="outlined"
                icon="eye"
                className="image-mask-info-icon"
              />
              预览
            </div>
          </div>
        )}
      </div>
    </>
  );
}
