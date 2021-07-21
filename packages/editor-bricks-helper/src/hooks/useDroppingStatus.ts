import { useEffect, useState } from "react";
import { BuilderDroppingStatus } from "../interfaces";
import { useBuilderDataManager } from "./useBuilderDataManager";

export function useDroppingStatus(): BuilderDroppingStatus {
  const manager = useBuilderDataManager();
  const [droppingStatus, setDroppingStatus] = useState(
    manager.getDroppingStatus()
  );
  useEffect(
    () =>
      manager.onDroppingStatusChange(() => {
        setDroppingStatus(manager.getDroppingStatus());
      }),
    [manager]
  );
  return droppingStatus;
}
