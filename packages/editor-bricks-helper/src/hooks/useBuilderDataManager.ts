import React from "react";
import { BuilderContext } from "../BuilderContext";
import { BuilderDataManager } from "../internal/BuilderDataManager";

export function useBuilderDataManager(): BuilderDataManager {
  const { manager } = React.useContext(BuilderContext);
  if (!manager) {
    throw new Error("Expected builder data context");
  }
  return manager;
}
