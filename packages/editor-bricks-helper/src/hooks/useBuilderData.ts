import { useCallback, useEffect, useState } from "react";
import { BuilderCanvasData, BuilderEventType } from "../interfaces";
import { getCachedCanvasData } from "../internal/cachedCanvasData";

export function useBuilderData(): BuilderCanvasData {
  const [data, setData] = useState<BuilderCanvasData>(getCachedCanvasData());
  const onBuilderDataUpdate = useCallback((): void => {
    setData(getCachedCanvasData());
  }, []);

  useEffect(() => {
    window.addEventListener(BuilderEventType.DATA_UPDATE, onBuilderDataUpdate);
    return () =>
      window.removeEventListener(
        BuilderEventType.DATA_UPDATE,
        onBuilderDataUpdate
      );
  }, [onBuilderDataUpdate]);

  return data;
}
