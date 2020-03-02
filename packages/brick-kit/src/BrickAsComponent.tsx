import React from "react";
import { cloneDeep } from "lodash";
import {
  bindListeners,
  transformProperties,
  doTransform,
  setRealProperties,
  unbindListeners,
  isObject
} from "@easyops/brick-utils";
import { UseBrickConf, UseSingleBrickConf } from "@easyops/brick-types";
import { getHistory } from "./history";
import { RuntimeBrick } from "./core/exports";
import { getRuntime } from "./runtime";
import { handleHttpError } from "./handleHttpError";

interface BrickAsComponentProps {
  useBrick: UseBrickConf;
  data?: any;
}

export function BrickAsComponent(
  props: BrickAsComponentProps
): React.ReactElement {
  if (Array.isArray(props.useBrick)) {
    return (
      <>
        {props.useBrick.map((item, index) => (
          <SingleBrickAsComponent
            key={index}
            useBrick={item}
            data={props.data}
          />
        ))}
      </>
    );
  }
  return <SingleBrickAsComponent useBrick={props.useBrick} data={props.data} />;
}

interface SingleBrickAsComponentProps {
  useBrick: UseSingleBrickConf;
  data?: any;
}

function SingleBrickAsComponent(
  props: SingleBrickAsComponentProps
): React.ReactElement {
  const { useBrick, data } = props;

  const runtimeBrick = React.useMemo(async () => {
    // If the router state is initial, ignore rendering the sub-brick.
    if (getRuntime()._internalApiGetRouterState() === "initial") {
      return;
    }
    if (useBrick.template) {
      delete useBrick.transform;
      delete useBrick.transformFrom;
      getRuntime()
        ._internalApiGetResolver()
        .processBrick(useBrick);
    }
    const brick: RuntimeBrick = {
      type: useBrick.brick,
      properties: cloneDeep(useBrick.properties) || {}
    };
    transformProperties(
      brick.properties,
      data,
      useBrick.transform,
      useBrick.transformFrom
    );
    if (useBrick.lifeCycle) {
      const resolver = getRuntime()._internalApiGetResolver();
      try {
        await resolver.resolve(
          {
            brick: useBrick.brick,
            lifeCycle: useBrick.lifeCycle
          },
          brick
        );
      } catch (e) {
        handleHttpError(e);
      }
    }
    return brick;
  }, [useBrick, data]);

  const refCallback = React.useCallback(
    async (element: HTMLElement) => {
      if (element) {
        const brick = await runtimeBrick;
        // sub-brick rendering is ignored.
        if (!brick) {
          return;
        }
        brick.element = element;
        setRealProperties(element, brick.properties);
        unbindListeners(element);
        if (useBrick.events) {
          bindListeners(
            element,
            doTransform(data, useBrick.events),
            getHistory()
          );
        }
      }
    },
    [runtimeBrick, useBrick, data]
  );

  if (isObject(useBrick.if)) {
    // eslint-disable-next-line
    console.warn("Currently don't support resolvable-if in `useBrick`");
  } else if (
    typeof useBrick.if === "boolean" ||
    typeof useBrick.if === "string"
  ) {
    const ifChecked = doTransform(data, useBrick.if);
    if (ifChecked === false) {
      return null;
    }
  }

  return React.createElement(useBrick.brick, {
    ref: refCallback
  });
}
