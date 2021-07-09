import { createContext, Dispatch, SetStateAction } from "react";

// It indicates which mount point of a container is active dropping zone.
type DroppingStatus = {
  [mountPoint: string]: boolean;
};

interface ContextOfDroppingStatus {
  droppingStatus?: DroppingStatus;
  setDroppingStatus?: Dispatch<SetStateAction<DroppingStatus>>;
}

// Todo(steve): remove this file.
/** @deprecated no more usage but for compatibility only. */
export const DroppingStatusContext = createContext<ContextOfDroppingStatus>({});
