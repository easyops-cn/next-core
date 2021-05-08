import React from "react";
import { shallow } from "enzyme";
import { BuilderRuntimeNode } from "../interfaces";
import { useCanvasList } from "./useCanvasList";

const consoleLog = jest.spyOn(console, "log").mockImplementation(() => void 0);

function TestComponent(props: {
  rootChildNodes: BuilderRuntimeNode[];
}): React.ReactElement {
  const canvasList = useCanvasList(props.rootChildNodes);
  // eslint-disable-next-line no-console
  console.log(canvasList);
  return <div>TestComponent</div>;
}

describe("useCanvasList", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each<[Partial<BuilderRuntimeNode>[], Partial<BuilderRuntimeNode>[][]]>([
    [[], [[], []]],
    [
      [
        {
          $$uid: 1,
        },
        {
          $$uid: 2,
          portal: true,
        },
        {
          $$uid: 3,
        },
        {
          $$uid: 4,
          portal: true,
        },
      ],
      [
        [
          {
            $$uid: 1,
          },
          {
            $$uid: 3,
          },
        ],
        [
          {
            $$uid: 2,
            portal: true,
          },
        ],
        [
          {
            $$uid: 4,
            portal: true,
          },
        ],
        [],
      ],
    ],
  ])("should work", (rootChildNodes, canvasList) => {
    shallow(
      <TestComponent rootChildNodes={rootChildNodes as BuilderRuntimeNode[]} />
    );
    expect(consoleLog).toBeCalledWith(canvasList);
  });
});
