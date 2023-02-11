import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import type { UseSingleBrickConf } from "@next-core/brick-types";
import { __secret_internals } from "@next-core/runtime";

export interface ReactUseBrickProps {
  useBrick: UseSingleBrickConf;
  data?: unknown;
}

export function ReactUseBrick({
  useBrick,
  data,
}: ReactUseBrickProps): React.ReactElement | null {
  const [output, setOutput] = useState<Awaited<
    ReturnType<typeof __secret_internals.renderUseBrick>
  > | null>(null);
  const mountResult = useRef<__secret_internals.MountUseBrickResult>();
  const [renderKey, setRenderKey] = useState<number>();
  const elementRef = useRef<HTMLElement | null>();
  const IdCounterRef = useRef(0);

  useEffect(() => {
    async function init() {
      try {
        setOutput(await __secret_internals.renderUseBrick(useBrick, data));
        setRenderKey(getUniqueId(IdCounterRef));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Render useBrick failed:", useBrick, "with data:", data);
      }
    }
    // setOutput(null);
    init();
  }, [data, useBrick]);

  if (!output) {
    // Fallback when loading/
    return null;
    // return <span>🌀 Loading...</span>;
  }

  const mainBrick = output.main[0];
  if (mainBrick) {
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
              mainBrick,
              element,
              output.portal,
              mountResult.current
            );
          } else {
            __secret_internals.unmountUseBrick(mountResult.current);
          }
        }}
      />
    );
  }

  mountResult.current = __secret_internals.mountUseBrick(
    null,
    null,
    output.portal,
    mountResult.current
  );

  return null;
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
