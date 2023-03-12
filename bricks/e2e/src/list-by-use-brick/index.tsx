import React from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import { ReactUseBrick } from "@next-core/react-runtime";
import { UseSingleBrickConf } from "@next-core/types";

const { defineElement, property } = createDecorators();

@defineElement("e2e.list-by-use-brick", {
  shadowOptions: false,
})
class ListByUseBrick extends ReactNextElement {
  @property({ attribute: false })
  accessor useBrick: UseSingleBrickConf;

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
  useBrick: UseSingleBrickConf;
  data: unknown;
}) {
  if (!useBrick || !Array.isArray(data)) {
    return null;
  }
  return (
    <>
      {data.map((datum, index) => (
        <ReactUseBrick useBrick={useBrick} data={datum} key={index} />
      ))}
    </>
  );
}
