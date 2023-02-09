import React, { useMemo, Suspense, lazy, PropsWithChildren } from "react";
import type {
  UseBrickSlotsConf,
  UseSingleBrickConf,
} from "@next-core/brick-types";
import { __secret_internals } from "@next-core/runtime";

export interface ReactUseBrickProps {
  useBrick: UseSingleBrickConf;
  data?: unknown;
}

export function ReactUseBrick(
  props: ReactUseBrickProps
): React.ReactElement | null {
  const LazyWebComponent = lazy(async () => {
    if (props.useBrick.brick.includes("-")) {
      await __secret_internals.loadBricksForUseBrick(props.useBrick.brick);
    }
    return { default: LegacyReactUseBrick };
  });

  return (
    <Suspense>
      <LazyWebComponent {...props} />
    </Suspense>
  );
}

function LegacyReactUseBrick({
  useBrick,
  data,
}: PropsWithChildren<ReactUseBrickProps>): React.ReactElement | null {
  const WebComponent = useBrick.brick as any;
  const elementHolder = useMemo<{ element?: any }>(() => ({}), []);
  const useBrickContext = { data };

  if (!__secret_internals.checkIfForUseBrick(useBrick, useBrickContext)) {
    return null;
  }

  const {
    ref: _ref,
    key: _key,
    textContent,
    dataset,
    ...properties
  } = __secret_internals.computeRealPropertiesForUseBrick(
    useBrick.properties,
    useBrickContext
  ) as {
    ref?: unknown;
    textContent?: string;
    [key: string]: unknown;
  };

  if (dataset) {
    for (const [key, value] of Object.entries(dataset)) {
      properties[`data-${key}`] = value;
    }
  }

  return (
    <WebComponent
      {...properties}
      {...Object.fromEntries(
        Object.entries(useBrick.events ?? {}).map(([eventType, handlers]) => [
          `on${eventType}`,
          __secret_internals.listenerFactoryForUseBrick(
            handlers,
            useBrickContext,
            elementHolder
          ),
        ])
      )}
    >
      {textContent ||
        slotsToChildren(useBrick.slots).map((item, index) => (
          <ReactUseBrick key={index} useBrick={item} data={data} />
        ))}
    </WebComponent>
  );
}

function slotsToChildren(
  slots: UseBrickSlotsConf | undefined
): UseSingleBrickConf[] {
  if (!slots) {
    return [];
  }
  return Object.entries(slots).flatMap(([slot, slotConf]) =>
    Array.isArray(slotConf.bricks)
      ? slotConf.bricks.map((child) => ({
          ...child,
          properties: {
            ...child.properties,
            slot,
          },
        }))
      : []
  );
}
