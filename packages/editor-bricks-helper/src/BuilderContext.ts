import React from "react";
import { BuilderDataManager } from "./internal/BuilderDataManager";

export interface ContextOfBuilder {
  manager?: BuilderDataManager;
}

export const BuilderContext = React.createContext<ContextOfBuilder>({});

export function createBuilderContext(): ContextOfBuilder {
  return {
    manager: new BuilderDataManager(),
  };
}
