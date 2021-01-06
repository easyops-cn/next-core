import { useEffect, useState } from "react";
import { BuilderCanvasData } from "../interfaces";
import { useBuilderDataManager } from "./useBuilderDataManager";

export function useBuilderData(): BuilderCanvasData {
  const manager = useBuilderDataManager();
  const [data, setData] = useState(manager.getData());
  useEffect(
    () =>
      manager.onDataChange(() => {
        setData(manager.getData());
      }),
    [manager]
  );
  return data;
}
