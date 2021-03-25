import { useEffect, useState } from "react";
import { useBuilderDataManager } from "./useBuilderDataManager";

export function useHighlightNodes(): Set<number> {
  const manager = useBuilderDataManager();
  const [data, setData] = useState(manager.getHighlightNodes());
  useEffect(
    () =>
      manager.onHighlightNodesChange(() => {
        setData(manager.getHighlightNodes());
      }),
    [manager]
  );
  return data;
}
