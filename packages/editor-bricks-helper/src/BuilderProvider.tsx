// See https://github.com/react-dnd/react-dnd/blob/main/packages/react-dnd/src/common/DndProvider.tsx
import React from "react";
import {
  BuilderContext,
  ContextOfBuilder,
  createBuilderContext,
} from "./BuilderContext";

export const BuilderProvider = React.memo(LegacyBuilderProvider);

const instanceSymbol = Symbol.for("__BRICK_NEXT_BUILDER_CONTEXT_INSTANCE__");
function createSingletonBuilderContext(): ContextOfBuilder {
  const ctx = window as any;
  if (!ctx[instanceSymbol]) {
    ctx[instanceSymbol] = createBuilderContext();
  }
  return ctx[instanceSymbol];
}

let refCount = 0;

function LegacyBuilderProvider({
  children,
}: React.PropsWithChildren<any>): React.ReactElement {
  const context = createSingletonBuilderContext();

  /**
   * If the global context was used to store the DND context
   * then where theres no more references to it we should
   * clean it up to avoid memory leaks
   */
  React.useEffect(() => {
    refCount++;

    return () => {
      refCount--;

      if (refCount === 0) {
        (window as any)[instanceSymbol] = null;
      }
    };
  }, []);

  return (
    <BuilderContext.Provider value={context}>
      {children}
    </BuilderContext.Provider>
  );
}
