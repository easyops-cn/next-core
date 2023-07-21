import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { UseSingleBrickConf } from "@next-core/types";
import { __secret_internals, handleHttpError } from "@next-core/runtime";

export interface ReactUseBrickProps {
  useBrick: UseSingleBrickConf;
  data?: unknown;
}

// Note: always synchronize code in LegacyUseBrick:
// `bricks/v2-adapter/src/data-providers/legacy-brick-kit/getLegacyUseBrick.ts`
let ReactUseBrick = function ReactUseBrick({
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
        console.error("Render useBrick failed:", useBrick, "with data:", data);
        handleHttpError(error);
      }
    }
    init();
  }, [data, useBrick]);

  const refCallback = useCallback(
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
  return <WebComponent key={renderKey} ref={refCallback} />;
};

function getUniqueId(ref: MutableRefObject<number>): number {
  return ++ref.current;
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

// istanbul ignore next
// Make v3 bricks compatible with Brick Next v2.
if (
  (window as any).dll &&
  window.BRICK_NEXT_VERSIONS?.["brick-container"]?.startsWith("2.")
) {
  const legacyKit = (window as any).dll("tYg3");
  ReactUseBrick = legacyKit.SingleBrickAsComponentFactory(React);
  ReactUseMultipleBricks = legacyKit.BrickAsComponentFactory(React);
}

export { ReactUseBrick, ReactUseMultipleBricks };
