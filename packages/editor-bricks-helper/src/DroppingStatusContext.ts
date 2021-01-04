import { createContext, Dispatch, SetStateAction, useContext } from "react";

// It indicates which mount point of a container is active dropping zone.
export type DroppingStatus = {
  [mountPoint: string]: boolean;
};

export interface ContextOfDroppingStatus {
  droppingStatus?: DroppingStatus;
  setDroppingStatus?: Dispatch<SetStateAction<DroppingStatus>>;
}

export const DroppingStatusContext = createContext<ContextOfDroppingStatus>({});

export function useDroppingStatusContext(): ContextOfDroppingStatus {
  return useContext(DroppingStatusContext);
}
