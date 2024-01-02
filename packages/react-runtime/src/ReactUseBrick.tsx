import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { UseSingleBrickConf } from "@next-core/types";
import {
  __secret_internals,
  handleHttpError,
  getV2RuntimeFromDll,
} from "@next-core/runtime";

export type { UseSingleBrickConf };

export interface ReactUseBrickProps {
  useBrick: UseSingleBrickConf;
  data?: unknown;
  refCallback?: (element: HTMLElement | null) => void;
  ignoredCallback?: () => void;
}

// Note: always synchronize code in LegacyUseBrick:
// `bricks/v2-adapter/src/data-providers/legacy-brick-kit/getLegacyUseBrick.ts`
let ReactUseBrick = function ReactUseBrick({
  useBrick,
  data,
  refCallback,
  ignoredCallback,
}: ReactUseBrickProps): React.ReactElement | null {
  const [renderResult, setRenderResult] =
    useState<__secret_internals.RenderUseBrickResult | null>(null);
  const mountResult = useRef<__secret_internals.MountUseBrickResult>();
  const [renderKey, setRenderKey] = useState<number>();
  const IdCounterRef = useRef(0);
  const initialRenderId = useMemo(() => __secret_internals.getRenderId?.(), []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const newRender = await __secret_internals.renderUseBrick(
          useBrick,
          data
        );
        if (ignore) {
          return;
        }
        setRenderResult(newRender);
        setRenderKey(getUniqueId(IdCounterRef));
      } catch (error) {
        if (isTheSameRender(initialRenderId)) {
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
    }
    init();
    return () => {
      ignore = true;
    };
  }, [data, useBrick, initialRenderId]);

  const _refCallback = useCallback(
    (element: HTMLElement | null) => {
      if (element) {
        mountResult.current = __secret_internals.mountUseBrick(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          renderResult!,
          element
        );
      } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        __secret_internals.unmountUseBrick(renderResult!, mountResult.current!);
        mountResult.current = undefined;
      }
      refCallback?.(element);
    },
    [refCallback, renderResult]
  );

  if (!renderResult) {
    // Fallback when loading/
    return null;
    // return <span>🌀 Loading...</span>;
  }

  const { tagName } = renderResult;
  if (tagName === null) {
    ignoredCallback?.();
    return null;
  }

  const WebComponent = tagName as any;
  return <WebComponent key={renderKey} ref={_refCallback} />;
};

function getUniqueId(ref: MutableRefObject<number>): number {
  return ++ref.current;
}

function isTheSameRender(initialRenderId: string | undefined): boolean {
  const newRenderId = __secret_internals.getRenderId?.();
  return !initialRenderId || !newRenderId || initialRenderId === newRenderId;
}

export interface ReactUseMultipleBricksProps {
  useBrick: UseSingleBrickConf | UseSingleBrickConf[];
  data?: unknown;
}

let ReactUseMultipleBricks = function ReactUseMultipleBricks({
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
};

// Make v3 bricks compatible with Brick Next v2.
// istanbul ignore next
const v2Kit = getV2RuntimeFromDll();
// istanbul ignore next
if (v2Kit) {
  const { SingleBrickAsComponentFactory, BrickAsComponentFactory } = v2Kit;
  if (SingleBrickAsComponentFactory && BrickAsComponentFactory) {
    ReactUseBrick = SingleBrickAsComponentFactory(React);
    ReactUseMultipleBricks = BrickAsComponentFactory(React);
  }
}

export { ReactUseBrick, ReactUseMultipleBricks };
