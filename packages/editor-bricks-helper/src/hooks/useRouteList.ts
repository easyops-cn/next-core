import { useEffect, useState } from "react";
import { useBuilderDataManager } from "./useBuilderDataManager";
import { BuilderRouteNode } from "@next-core/brick-types";

export function useRouteList(): BuilderRouteNode[] {
  const manager = useBuilderDataManager();
  const [data, setData] = useState(manager.getRouteList());
  useEffect(
    () =>
      manager.onRouteListChange(() => {
        setData(manager.getRouteList());
      }),
    [manager]
  );
  return data;
}
