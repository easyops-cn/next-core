import React from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import { ReactUseMultipleBricks } from "@next-core/react-runtime";
import { UseBrickConf } from "@next-core/types";

const { defineElement, property } = createDecorators();

interface Column {
  dataIndex: string | number;
  useBrick: UseBrickConf;
}

export
@defineElement("e2e.simple-table", {
  shadowOptions: false,
})
class SimpleTable extends ReactNextElement {
  @property({ attribute: false })
  accessor columns: Column[];

  @property({ attribute: false })
  accessor data: unknown;

  render() {
    return <SimpleTableComponent columns={this.columns} data={this.data} />;
  }
}

export function SimpleTableComponent({
  columns,
  data,
}: {
  columns: Column[];
  data: unknown;
}) {
  if (!Array.isArray(columns) || !Array.isArray(data)) {
    return null;
  }
  return (
    <table>
      <tbody>
        {data.map((datum, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((col, colIndex) => (
              <td key={colIndex}>
                <ReactUseMultipleBricks
                  useBrick={col.useBrick}
                  data={datum[col.dataIndex]}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
