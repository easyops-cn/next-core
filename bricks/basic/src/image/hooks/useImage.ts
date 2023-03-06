import React, { useEffect } from "react";

type ImageStatus = "normal" | "error" | "loading";

const cache: Map<string, Promise<boolean>> = new Map();

const isImageValid = (src: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
};

const walkImageList = (srcList: string[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    const walk = async () => {
      for (const src of srcList) {
        if (!cache.has(src)) {
          cache.set(src, isImageValid(src));
        }

        const isValid = await cache.get(src);
        if (isValid) {
          resolve(src);
          return;
        }
      }
      reject(srcList[srcList.length - 1]);
    };
    walk();
  });
};

export default function useImage(srcList: string | string[]) {
  const [status, setStatus] = React.useState<ImageStatus>();
  const [validSrc, setValidSrc] = React.useState<string>();

  useEffect(() => {
    const _srcList = ([] as Array<string>).concat(srcList).filter(Boolean);
    setValidSrc(undefined);

    if (_srcList.length) {
      setStatus("loading");

      walkImageList(_srcList)
        .then((src) => {
          setStatus("normal");
          setValidSrc(src);
        })
        .catch((fallback) => {
          setStatus("error");
          setValidSrc(fallback);
        });
    } else {
      setStatus("normal");
    }
  }, [srcList]);

  return { status, src: validSrc };
}
