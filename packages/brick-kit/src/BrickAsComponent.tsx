import React from "react";
import { cloneDeep } from "lodash";
import { isObject } from "@easyops/brick-utils";
import { UseBrickConf, UseSingleBrickConf } from "@easyops/brick-types";
import { bindListeners, unbindListeners } from "./bindListeners";
import { setRealProperties } from "./setProperties";
import {
  RuntimeBrick,
  _internalApiGetResolver,
  _internalApiGetRouterState,
} from "./core/exports";
import { handleHttpError } from "./handleHttpError";
import { transformProperties, doTransform } from "./transformProperties";

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

interface SingleBrickAsComponentProps extends BrickAsComponentProps {
  useBrick: UseSingleBrickConf;
}

function SingleBrickAsComponent(
  props: SingleBrickAsComponentProps
): React.ReactElement {
  const { useBrick, data } = props;

  const runtimeBrick = React.useMemo(async () => {
    // If the router state is initial, ignore rendering the sub-brick.
    if (_internalApiGetRouterState() === "initial") {
      return;
    }
    const brick: RuntimeBrick = {
      type: useBrick.brick,
      properties: cloneDeep(useBrick.properties) || {},
    };
    transformProperties(
      brick.properties,
      data,
      useBrick.transform,
      useBrick.transformFrom
    );
    if (useBrick.lifeCycle) {
      const resolver = _internalApiGetResolver();
      try {
        await resolver.resolve(
          {
            brick: useBrick.brick,
            lifeCycle: useBrick.lifeCycle,
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
          bindListeners(element, doTransform(data, useBrick.events));
        }
      }
    },
    [runtimeBrick, useBrick, data]
  );

  if (isObject(useBrick.if)) {
    // eslint-disable-next-line
    console.warn("Currently resolvable-if in `useBrick` is not supported.");
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
    ref: refCallback,
  });
}
