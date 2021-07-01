import { useCallback, useEffect, useState } from "react";
import { useBuilderDataManager } from "./useBuilderDataManager";
import { SharedEditorConf } from "../interfaces";

export function useSharedEditorMap(): Map<string, SharedEditorConf> {
  const manager = useBuilderDataManager();

  const getSharedEditorMap = useCallback(
    (): Map<string, SharedEditorConf> =>
      new Map(manager.getSharedEditorList().map((conf) => [conf.id, conf])),
    [manager]
  );

  const [data, setData] = useState(getSharedEditorMap());

  useEffect(
    () =>
      manager.onSharedEditorListChange(() => {
        setData(getSharedEditorMap());
      }),
    [getSharedEditorMap, manager]
  );

  return data;
}
