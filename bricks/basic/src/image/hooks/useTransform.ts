import { useState } from "react";
import { MAX_SCALE, MIN_SCALE } from "../previewConfig.js";

type TransformType = {
  translateX: number;
  translateY: number;
  scale: number;
  rotate: number;
};

const initialTransform: TransformType = {
  translateX: 0,
  translateY: 0,
  scale: 1,
  rotate: 0,
};

export default function useTransform() {
  const [transform, setTransform] = useState(initialTransform);

  const resetTransform = () => {
    setTransform(initialTransform);
  };

  const updateTransform = (newTransform: Partial<TransformType>) => {
    requestAnimationFrame(() => {
      setTransform((preTransform) => {
        return { ...preTransform, ...newTransform };
      });
    });
  };

  const dispatchZoomChange = (ratio: number) => {
    let scale = transform.scale * ratio;
    if (scale > MAX_SCALE) {
      scale = MAX_SCALE;
    } else if (scale < MIN_SCALE) {
      scale = MIN_SCALE;
    }

    updateTransform({
      scale,
    });
  };

  return {
    transform,
    resetTransform,
    updateTransform,
    dispatchZoomChange,
  };
}
