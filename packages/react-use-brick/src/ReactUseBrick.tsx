import React from "react";

export interface ReactUseBrickProps {
  useBrick: {
    brick: string;
    properties?: Record<string, unknown>;
  };
  data?: unknown;
}

export function ReactUseBrick({
  useBrick,
  data,
}: ReactUseBrickProps): React.ReactElement {
  const Component = useBrick.brick;
  return <Component {...useBrick.properties} />;
}
