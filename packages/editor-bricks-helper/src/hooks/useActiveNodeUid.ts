import { useEffect, useState } from "react";
import { useBuilderDataManager } from "./useBuilderDataManager";

export function useActiveNodeUid(): number {
  const manager = useBuilderDataManager();
  const [data, setData] = useState(manager.getActiveNodeUid());
  useEffect(
    () =>
      manager.onActiveNodeChange(() => {
        setData(manager.getActiveNodeUid());
      }),
    [manager]
  );
  return data;
}
