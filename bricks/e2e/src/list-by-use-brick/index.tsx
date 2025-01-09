import React from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import { ReactUseMultipleBricks } from "@next-core/react-runtime";
import { UseBrickConf } from "@next-core/types";

const { defineElement, property } = createDecorators();

export
@defineElement("e2e.list-by-use-brick", {
  shadowOptions: false,
  alias: ["eo-list-by-use-brick"],
})
class ListByUseBrick extends ReactNextElement {
  @property({ attribute: false })
  accessor useBrick: UseBrickConf;

  @property({ attribute: false })
  accessor data: unknown;

  render() {
    return (
      <ListByUseBrickComponent useBrick={this.useBrick} data={this.data} />
    );
  }
}

export function ListByUseBrickComponent({
  useBrick,
  data,
}: {
  useBrick: UseBrickConf;
  data: unknown;
}) {
  if (!useBrick || !Array.isArray(data)) {
    return null;
  }
  return (
    <>
      {data.map((datum, index) => (
        <ReactUseMultipleBricks useBrick={useBrick} data={datum} key={index} />
      ))}
    </>
  );
}
