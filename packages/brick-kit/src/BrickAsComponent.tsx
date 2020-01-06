import React from "react";
import { cloneDeep } from "lodash";
import { bindListeners, transformProperties } from "@easyops/brick-utils";
import { UseBrickConf } from "@easyops/brick-types";
import { getHistory } from "./history";

interface BrickAsComponentProps {
  useBrick: UseBrickConf;
  data?: any;
}

export function BrickAsComponent(
  props: BrickAsComponentProps
): React.ReactElement {
  const transformedProperties = React.useMemo(
    () =>
      transformProperties(
        cloneDeep(props.useBrick.properties) || {},
        props.data,
        props.useBrick.transform,
        props.useBrick.transformFrom
      ),
    [props.useBrick, props.data]
  );

  const refCallback = React.useCallback(
    (element: HTMLElement): void => {
      if (element) {
        Object.assign(element, transformedProperties);
        if (props.useBrick.events) {
          bindListeners(element, props.useBrick.events, getHistory());
        }
      }
    },
    [transformedProperties, props.useBrick]
  );

  return React.createElement(props.useBrick.brick, {
    ref: refCallback
  });
}
