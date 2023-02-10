import React, { Suspense, lazy, PropsWithChildren, useCallback } from "react";
import type {
  UseBrickSlotsConf,
  UseSingleBrickConf,
} from "@next-core/brick-types";
import { __secret_internals } from "@next-core/runtime";

export interface ReactUseBrickProps {
  useBrick: UseSingleBrickConf;
  data?: unknown;
}
export function ReactUseBrick({
  useBrick,
  data,
}: ReactUseBrickProps): React.ReactElement | null {
  const useBrickContext = __secret_internals.getUseBrickContext(useBrick, data);
  if (!__secret_internals.checkIfForUseBrick(useBrick, useBrickContext)) {
    return null;
  }

  const tplTagName = __secret_internals.getTplTagName(useBrick.brick);
  const tagName = tplTagName || useBrick.brick;

  if (!tagName.includes("-")) {
    return (
      <LegacyReactUseBrick
        useBrick={useBrick}
        data={data}
        tplTagName={tplTagName}
      />
    );
  }

  const LazyWebComponent = lazy(async () => {
    await __secret_internals.loadBricks([tagName]);
    return { default: LegacyReactUseBrick };
  });

  return (
    <Suspense>
      <LazyWebComponent
        useBrick={useBrick}
        data={data}
        tplTagName={tplTagName}
      />
    </Suspense>
  );
}

function LegacyReactUseBrick({
  useBrick,
  data,
  tplTagName,
}: PropsWithChildren<ReactUseBrickProps> & {
  tplTagName?: string | false;
}): React.ReactElement | null {
  const WebComponent = useBrick.brick as any;
  const useBrickContext = __secret_internals.getUseBrickContext(useBrick, data);

  const { expandedUseBrick, runtimeBrick } =
    __secret_internals.expandCustomTemplateForUseBrick(
      tplTagName,
      useBrick,
      useBrickContext
    );

  const {
    ref: _ref,
    key: _key,
    children: _children,
    textContent,
    dataset,
    slot,
    ...properties
  } = expandedUseBrick.properties ??
  ({} as {
    ref?: unknown;
    textContent?: string;
    [key: string]: unknown;
  });

  if (dataset) {
    for (const [key, value] of Object.entries(dataset)) {
      properties[`data-${key}`] = value;
    }
  }

  if (slot) {
    properties.slot = slot;
  }

  const refCallback = useCallback(
    (element: HTMLElement) => {
      runtimeBrick.element = element;
      if (element) {
        __secret_internals.bindListenersForUseBrick(
          element,
          expandedUseBrick.events,
          useBrickContext
        );
        __secret_internals.handleProxyOfCustomTemplate(runtimeBrick);
      }
    },
    [expandedUseBrick.events, runtimeBrick, useBrickContext]
  );

  return (
    <WebComponent ref={refCallback} {...properties}>
      {textContent ||
        slotsToChildren(expandedUseBrick.slots).map((item, index) => (
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

export interface ReactUseMultipleBricksProps {
  useBrick: UseSingleBrickConf | UseSingleBrickConf[];
  data?: unknown;
}

export function ReactUseMultipleBricks({
  useBrick,
  data,
}: ReactUseMultipleBricksProps): React.ReactElement | null {
  if (Array.isArray(useBrick)) {
    return (
      <>
        {useBrick.map((item, index) => (
          <ReactUseBrick key={index} useBrick={item} data={data} />
        ))}
      </>
    );
  }
  return <ReactUseBrick useBrick={useBrick} data={data} />;
}
