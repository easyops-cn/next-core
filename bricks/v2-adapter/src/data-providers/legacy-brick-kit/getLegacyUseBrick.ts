import type React from "react";
import type { UseSingleBrickConf } from "@next-core/types";
import { __secret_internals, handleHttpError } from "@next-core/runtime";

interface ReactUseBrickProps {
  useBrick: UseSingleBrickConf;
  data?: unknown;
}

interface ReactUseMultipleBricksProps {
  useBrick: UseSingleBrickConf | UseSingleBrickConf[];
  data?: unknown;
}

interface MutableRefObject<T> {
  current: T;
}

export function getLegacyUseBrick(LegacyReact: typeof React) {
  const { useEffect, useRef, useState, useCallback } = LegacyReact;
  function ReactUseBrick({
    useBrick,
    data,
  }: ReactUseBrickProps): React.ReactElement | null {
    const [renderResult, setRenderResult] =
      useState<__secret_internals.RenderUseBrickResult | null>(null);
    const mountResult = useRef<__secret_internals.MountUseBrickResult>();
    const [renderKey, setRenderKey] = useState<number>();
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
          console.error(
            "Render useBrick failed:",
            useBrick,
            "with data:",
            data
          );
          handleHttpError(error);
        }
      }
      // setOutput(null);
      init();
    }, [data, useBrick]);

    const refCallback = useCallback(
      (element: HTMLElement) => {
        if (element) {
          mountResult.current = __secret_internals.mountUseBrick(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            renderResult!,
            element
          );
        } else {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          __secret_internals.unmountUseBrick(
            renderResult!,
            mountResult.current!
          );
          mountResult.current = undefined;
        }
      },
      [renderResult]
    );

    if (!renderResult) {
      // Fallback when loading/
      return null;
      // return <span>🌀 Loading...</span>;
    }

    const { tagName } = renderResult;
    if (tagName === null) {
      return null;
    }

    const WebComponent = tagName as any;
    return LegacyReact.createElement(WebComponent, {
      key: renderKey,
      ref: refCallback,
    });
  }

  function ReactUseMultipleBricks({
    useBrick,
    data,
  }: ReactUseMultipleBricksProps): React.ReactElement | null {
    if (Array.isArray(useBrick)) {
      return LegacyReact.createElement(
        LegacyReact.Fragment,
        null,
        ...useBrick.map((item, index) =>
          LegacyReact.createElement(ReactUseBrick, {
            key: index,
            useBrick: item,
            data: data,
          })
        )
      );
    }
    return LegacyReact.createElement(ReactUseBrick, {
      useBrick,
      data,
    });
  }

  return {
    BrickAsComponent: ReactUseMultipleBricks,
    SingleBrickAsComponent: ReactUseBrick,
  };
}

function getUniqueId(ref: MutableRefObject<number>): number {
  return ++ref.current;
}
