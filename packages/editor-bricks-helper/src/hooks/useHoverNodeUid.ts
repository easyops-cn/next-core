import { useEffect, useState } from "react";
import { useBuilderDataManager } from "./useBuilderDataManager";

export function useHoverNodeUid(): number {
  const manager = useBuilderDataManager();
  const [data, setData] = useState(manager.getHoverNodeUid());
  useEffect(
    () =>
      manager.onHoverNodeChange(() => {
        setData(manager.getHoverNodeUid());
      }),
    [manager]
  );
  return data;
}
