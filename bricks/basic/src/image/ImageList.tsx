import React, { Ref, forwardRef, useImperativeHandle, useState } from "react";
import { ImageListContext } from "./ImageListContext.js";
import { Preview } from "./Preview.js";
import { ImageComponent } from "./ImageComponent.js";
import { isNil } from "lodash";

export interface ImageConfig {
  src?: string;
  fallback?: string;
  placeholder?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  preview?: boolean;
  style?: React.CSSProperties;
}

export interface ImageListProps {
  imgList?: ImageConfig[];
  onVisibleChange?: (visible: boolean) => void;
}

export interface ImageListRef {
  openPreview: (index?: number) => void;
  closePreview: () => void;
}

const { Provider } = ImageListContext;

export const ImageList = forwardRef(function LegacyImageList(
  { imgList, onVisibleChange }: ImageListProps,
  ref: Ref<ImageListRef>
) {
  const [visible, setVisible] = useState(false);

  const [currentUUid, setCurrentUUid] = useState<number | undefined>(undefined);

  const handleImageClick = (uuid: number, preview: boolean) => {
    if (preview) {
      setCurrentUUid(uuid);
      setVisible(true);
      onVisibleChange?.(true);
    }
  };

  const [imageListMap, setImageListMap] = useState<Map<number, PreviewImage>>(
    new Map()
  );

  const registerImage = (uuid: number, previewImage: PreviewImage) => {
    const unRegister = () => {
      setImageListMap((oldImageListMap) => {
        const clonedImageListMap = new Map(oldImageListMap);
        const deleteSucceed = clonedImageListMap.delete(uuid);
        return deleteSucceed ? clonedImageListMap : oldImageListMap;
      });
    };

    setImageListMap((oldImageListMap) => {
      return new Map(oldImageListMap).set(uuid, previewImage);
    });

    return unRegister;
  };

  const previewImageList = Array.from(imageListMap.values())
    .filter((v) => !!v.preview)
    .sort((a, b) => a.index - b.index);

  useImperativeHandle(ref, () => ({
    openPreview: (index?: number) => {
      if (isNil(index)) {
        setCurrentUUid(previewImageList[0]?.uuid);
      } else {
        setCurrentUUid(previewImageList.find((v) => v.index === index)?.uuid);
      }
      setVisible(true);
      onVisibleChange?.(true);
    },
    closePreview: () => {
      setVisible(false);
      onVisibleChange?.(false);
    },
  }));

  return (
    <>
      <Provider
        value={{
          previewImageList,
          currentUUid,
          setCurrentUUid,
          registerImage,
        }}
      >
        {imgList?.map((img, index) => {
          return (
            <ImageComponent
              key={index}
              index={index}
              src={img.src}
              fallback={img.fallback}
              placeholder={img.placeholder}
              alt={img.alt}
              width={img.width}
              height={img.height}
              style={img.style}
              preview={img.preview}
              onClick={handleImageClick}
            />
          );
        })}
        <Preview
          visible={visible}
          onClose={() => {
            setVisible(false);
            onVisibleChange?.(false);
          }}
        />
      </Provider>
    </>
  );
});
