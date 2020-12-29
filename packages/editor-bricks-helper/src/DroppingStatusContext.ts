import { createContext, Dispatch, useContext } from "react";

export interface ContextOfDroppingStatus {
  dropping?: boolean;
  setDropping?: Dispatch<boolean>;
  droppingMountPoint?: string;
  setDroppingMountPoint?: Dispatch<string>;
}

export const DroppingStatusContext = createContext<ContextOfDroppingStatus>({});

export function useDroppingStatusContext(): ContextOfDroppingStatus {
  return useContext(DroppingStatusContext);
}
