import { useEffect, useState } from "react";
import { useBuilderDataManager } from "./useBuilderDataManager";

export function useHighlighted(nodeUid: number): boolean {
  const manager = useBuilderDataManager();
  const [isHighlighted, setIsHighlighted] = useState(
    manager.isHighlighted(nodeUid)
  );
  useEffect(
    () =>
      manager.onHighlightNodesChange(() => {
        setIsHighlighted(manager.isHighlighted(nodeUid));
      }),
    [manager, nodeUid]
  );
  return isHighlighted;
}
