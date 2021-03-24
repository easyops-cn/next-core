import { useEffect, useState } from "react";
import { useBuilderDataManager } from "./useBuilderDataManager";

export function useShowRelatedNodesBasedOnEvents(): boolean {
  const manager = useBuilderDataManager();
  const [data, setData] = useState(manager.getShowRelatedNodesBasedOnEvents());
  useEffect(
    () =>
      manager.onShowRelatedNodesBasedOnEventsChange(() => {
        setData(manager.getShowRelatedNodesBasedOnEvents());
      }),
    [manager]
  );
  return data;
}
