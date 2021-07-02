import { useMemo } from "react";
import { useBuilderDataManager } from "./useBuilderDataManager";
import { Story } from "@next-core/brick-types";

export function useStoryList(): Story[] {
  const manager = useBuilderDataManager();
  const data = useMemo(() => manager.getStoryList(), [manager]);

  return data;
}
