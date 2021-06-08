import { useEffect, useState } from "react";
import { useBuilderDataManager } from "./useBuilderDataManager";

export function useOutlineEnabled(
  nodeInstanceId: string,
  inapplicable?: boolean
): boolean {
  const manager = useBuilderDataManager();
  const [enabled, setEnabled] = useState(
    inapplicable ? false : manager.isOutlineEnabled(nodeInstanceId)
  );
  useEffect(() => {
    if (!inapplicable) {
      return manager.onOutlineEnabledNodesChange(() => {
        setEnabled(manager.isOutlineEnabled(nodeInstanceId));
      });
    }
  }, [inapplicable, manager, nodeInstanceId]);
  return enabled;
}
