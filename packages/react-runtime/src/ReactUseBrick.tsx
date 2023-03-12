import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import type { UseSingleBrickConf } from "@next-core/types";
import { __secret_internals, handleHttpError } from "@next-core/runtime";

export interface ReactUseBrickProps {
  useBrick: UseSingleBrickConf;
  data?: unknown;
}

export function ReactUseBrick({
  useBrick,
  data,
}: ReactUseBrickProps): React.ReactElement | null {
  const [renderResult, setRenderResult] = useState<Awaited<
    ReturnType<typeof __secret_internals.renderUseBrick>
  > | null>(null);
  const mountResult = useRef<__secret_internals.MountUseBrickResult>();
  const [renderKey, setRenderKey] = useState<number>();
  const elementRef = useRef<HTMLElement | null>();
  const IdCounterRef = useRef(0);

  useEffect(() => {
    async function init() {
      try {
        setRenderResult(
          await __secret_internals.renderUseBrick(useBrick, data)
        );
        setRenderKey(getUniqueId(IdCounterRef));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Render useBrick failed:", useBrick, "with data:", data);
        handleHttpError(error);
      }
    }
    // setOutput(null);
    init();
  }, [data, useBrick]);

  if (!renderResult) {
    // Fallback when loading/
    return null;
    // return <span>🌀 Loading...</span>;
  }

  const { renderRoot, rendererContext } = renderResult;

  const mainBrick = renderRoot.child;

  if (!mainBrick) {
    return null;
  }

  const WebComponent = mainBrick.type as any;
  return (
    <WebComponent
      key={renderKey}
      ref={(element: HTMLElement) => {
        if (element) {
          if (elementRef.current === element) {
            return;
          }
          elementRef.current = element;
          mountResult.current = __secret_internals.mountUseBrick(
            renderRoot,
            element,
            mountResult.current
          );

          rendererContext.dispatchOnMount();
          rendererContext.initializeScrollIntoView();
          rendererContext.initializeMediaChange();
        } else if (mountResult.current) {
          __secret_internals.unmountUseBrick(mountResult.current);
          mountResult.current = undefined;
          rendererContext.dispatchOnUnmount();
          rendererContext.dispose();
        }
      }}
    />
  );
}

function getUniqueId(ref: MutableRefObject<number>): number {
  return ++ref.current;
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
