import { useEffect, useState } from "react";
import { BuilderContextMenuStatus } from "../interfaces";
import { useBuilderDataManager } from "./useBuilderDataManager";

export function useBuilderContextMenuStatus(): BuilderContextMenuStatus {
  const manager = useBuilderDataManager();
  const [status, setStatus] = useState(manager.getContextMenuStatus());
  useEffect(
    () =>
      manager.onContextMenuChange(() => {
        setStatus(manager.getContextMenuStatus());
      }),
    [manager]
  );
  return status;
}
