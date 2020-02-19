import React from "react";
import { cloneDeep } from "lodash";
import {
  bindListeners,
  transformProperties,
  doTransform,
  setRealProperties,
  unbindListeners
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
  const runtimeBrick = React.useMemo(async () => {
    // If the router state is initial, ignore rendering the sub-brick.
    if (getRuntime()._internalApiGetRouterState() === "initial") {
      return;
    }
    const brick: RuntimeBrick = {
      type: props.useBrick.brick,
      properties: cloneDeep(props.useBrick.properties) || {}
    };
    transformProperties(
      brick.properties,
      props.data,
      props.useBrick.transform,
      props.useBrick.transformFrom
    );
    if (props.useBrick.lifeCycle) {
      const resolver = getRuntime()._internalApiGetResolver();
      try {
        await resolver.resolve(
          {
            brick: props.useBrick.brick,
            lifeCycle: props.useBrick.lifeCycle
          },
          brick
        );
      } catch (e) {
        handleHttpError(e);
      }
    }
    return brick;
  }, [props.useBrick, props.data]);

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
        if (props.useBrick.events) {
          bindListeners(
            element,
            doTransform(props.data, props.useBrick.events),
            getHistory()
          );
        }
      }
    },
    [runtimeBrick, props.useBrick, props.data]
  );

  return React.createElement(props.useBrick.brick, {
    ref: refCallback
  });
}
