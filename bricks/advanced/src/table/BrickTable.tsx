import React, { useState, useEffect, useRef, useMemo } from "react";
import { Table, type TableProps } from "antd";
import { getCellStyle } from "./utils.js";
import { pickBy, isNil, toPath, isEqual } from "lodash";
import classNames from "classnames";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import update from "immutability-helper";
import { CustomColumn } from "./index.js";
import { ReactUseBrick } from "@next-core/react-runtime";
import type { UseSingleBrickConf } from "@next-core/types";
import { wrapBrick } from "@next-core/react-element";
import type {
  GeneralIcon,
  GeneralIconProps,
} from "@next-bricks/icons/general-icon";
const type = "DraggableBodyRow";

const downMenuIcon: GeneralIconProps = {
  lib: "antd",
  icon: "down",
  theme: "outlined",
};

const rightMenuIcon: GeneralIconProps = {
  lib: "antd",
  icon: "right",
  theme: "outlined",
};

const WrappedIcon = wrapBrick<GeneralIcon, GeneralIconProps>(
  "icons.general-icon"
);

export interface BrickTableProps {
  dataSource: Record<string, any>[];
  columns: CustomColumn[];
  configProps?: TableProps<any>;
  error?: any;
  onDelete?: (index: number) => void;
  onChange: any;
  onSelectChange?: (selected: string[]) => void;
  showCard?: boolean;
  // 展开行相关属性
  expandedRowBrick?: {
    useBrick?: UseSingleBrickConf;
  };
  expandIcon?: {
    collapsedIcon: GeneralIconProps;
    expandedIcon: GeneralIconProps;
  };
  expandIconAsCell?: boolean;
  expandIconColumnIndex?: number;
  expandRowByClick?: boolean;
  defaultExpandAllRows?: boolean;
  onExpand?: (expanded: boolean, record: Record<string, any>) => void;
  onExpandedRowsChange?: (expandedRows: React.Key[]) => void;
  expandedRowKeys?: React.Key[];
  rowKey?: string;
  childrenColumnName?: string;
  tableDraggable?: boolean;
  onDrag?: (data: Record<string, any>[]) => void;
  zebraPattern?: boolean;
  scroll?: TableProps<unknown>["scroll"];
  optimizedColumns?: Array<string | number>;
  ellipsisInfo?: boolean;
  thTransparent?: boolean;
  showHeader?: boolean;
}

const DraggableBodyRow = ({
  index,
  moveRow,
  className,
  style,
  ...restProps
}: any) => {
  const ref = React.useRef(null);
  const [{ isOver, dropClassName }, drop] = useDrop({
    accept: type,
    collect: (monitor: any) => {
      const { index: dragIndex } = monitor.getItem() || {};
      if (dragIndex === index) {
        return {};
      }
      return {
        isOver: monitor.isOver(),
        dropClassName:
          dragIndex < index ? `dropOverDownward` : `dropOverUpward`,
      };
    },
    drop: (item: any) => {
      moveRow(item.index, index);
    },
  });
  const [, drag] = useDrag({
    type,
    item: { type, index },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  drop(drag(ref));
  return (
    <tr
      ref={ref}
      className={classNames(className, {
        [dropClassName as string]: isOver,
      })}
      style={{ cursor: "move", ...style }}
      {...restProps}
    />
  );
};

const getCustomHeader = (
  useBrick: UseSingleBrickConf,
  data?: { title: unknown }
): (() => React.ReactElement) => {
  return function CustomHeader() {
    return <ReactUseBrick useBrick={useBrick} data={data} />;
  };
};

type ItemBrickDataMap = Map<unknown, BrickData>;
type BrickData = {
  cellData: unknown;
  rowData: Record<string, unknown>;
  columnIndex: number;
};

const getCustomComp = (
  useBrick: UseSingleBrickConf,
  itemBrickDataMap?: ItemBrickDataMap
) => {
  return function CustomComp(
    value: any,
    item: Record<string, any>,
    index: number
  ) {
    if (useBrick) {
      let brickData: BrickData | undefined = itemBrickDataMap?.get(item);

      if (!brickData) {
        brickData = {
          cellData: value,
          rowData: item,
          columnIndex: index,
        };
        itemBrickDataMap?.set(item, brickData);
      }

      return <ReactUseBrick useBrick={useBrick} data={brickData} />;
    }
  };
};

export function BrickTable(props: BrickTableProps): React.ReactElement {
  if (props.error) {
    throw props.error;
  }

  const {
    configProps = {
      pagination: true,
      sortBy: false,
    },
    columns,
    rowKey = "key",
    expandIconAsCell,
    expandIconColumnIndex,
    childrenColumnName,
    scroll,
    optimizedColumns,
    onDelete, // 用于 brick form 中，will be deprecated
    ellipsisInfo,
    showHeader,
  } = props;

  const initData = useMemo(() => {
    return props.dataSource?.map((item, index) =>
      isNil(item[rowKey]) ? { ...item, [rowKey]: index } : item
    );
  }, [props.dataSource, rowKey]);

  const [data, setData] = useState(initData);
  const rowKeyExpandIconMapRef = useRef<Map<unknown, React.ReactNode>>(
    new Map()
  );
  const columnTitleBrickDataMapRef = useRef<
    Map<CustomColumn, { title: unknown }>
  >(new Map());
  const useBrickItemBrickDataMapRef = useRef<
    Map<UseSingleBrickConf, ItemBrickDataMap>
  >(new Map());
  const itemExpandedRowBrickDataMapRef = useRef<Map<unknown, unknown>>(
    new Map()
  );

  useEffect(() => {
    itemExpandedRowBrickDataMapRef.current.clear();
    setData(initData);
  }, [initData]);

  const expandIconColumnIndexOffset = (configProps as TableProps<any>)
    ?.rowSelection
    ? -1
    : 0;
  const customColumns = useMemo(() => {
    if (columns) {
      columnTitleBrickDataMapRef.current.clear();
      useBrickItemBrickDataMapRef.current.clear();
      const customColumns = columns.map((column, index) => {
        const {
          useBrick,
          valueSuffix,
          cellStatus,
          cellStyle = {},
          headerBrick,
          colSpanKey,
          rowSpanKey,
          filterDropdownBrick,
          ...columnConf
        } = column;
        if (headerBrick?.useBrick) {
          const useBrick = headerBrick?.useBrick;
          let data = columnTitleBrickDataMapRef.current.get(column);

          if (!data) {
            data = {
              title: columnConf.title,
            };
            columnTitleBrickDataMapRef.current.set(column, data);
          }

          columnConf.title = getCustomHeader(
            useBrick as UseSingleBrickConf,
            data
          );
        }

        if (filterDropdownBrick?.useBrick) {
          columnConf.filterDropdown = (
            <ReactUseBrick useBrick={filterDropdownBrick.useBrick} />
          );
        }

        if (useBrick) {
          let itemBrickDataMap: ItemBrickDataMap | undefined;

          if (useBrick) {
            itemBrickDataMap =
              useBrickItemBrickDataMapRef.current.get(useBrick);

            if (!itemBrickDataMap) {
              itemBrickDataMap = new Map();
              useBrickItemBrickDataMapRef.current.set(
                useBrick,
                itemBrickDataMap
              );
            }
          }

          columnConf.render = getCustomComp(useBrick, itemBrickDataMap);
          // [only update when record changed](https://ant.design/components/table-cn/#%E4%B8%BA%E4%BB%80%E4%B9%88-%E6%9B%B4%E6%96%B0-state-%E4%BC%9A%E5%AF%BC%E8%87%B4%E5%85%A8%E8%A1%A8%E6%B8%B2%E6%9F%93%EF%BC%9F)
          columnConf.shouldCellUpdate = (record: any, prevRecord: any) => {
            return !isEqual(record, prevRecord);
          };
        } else if (valueSuffix) {
          columnConf.render = (value: string) => value + valueSuffix;
        }
        if (
          !expandIconAsCell &&
          index === Number(expandIconColumnIndex) + expandIconColumnIndexOffset
        ) {
          const innerRender = columnConf.render;
          columnConf.render = function ExpandIcon(
            value: any,
            record: any,
            index: any
          ) {
            return (
              <>
                {!record[childrenColumnName as string] &&
                  rowKeyExpandIconMapRef.current.get(
                    rowKey ? record[rowKey] : record
                  )}
                {innerRender ? innerRender(value, record, index) : value}
              </>
            );
          };
        }
        if (cellStatus || colSpanKey || rowSpanKey || cellStyle) {
          const innerRender = columnConf.render;
          columnConf.render = (value: any, item: any, index: number) => {
            return {
              children: innerRender ? innerRender(value, item, index) : value,
              props: {
                colSpan: item[colSpanKey as string],
                rowSpan: item[rowSpanKey as string],
                style: {
                  ...(cellStatus ? getCellStyle(cellStatus, item, value) : {}),
                  ...cellStyle,
                },
              },
            };
          };
        }

        if (typeof columnConf.dataIndex === "string") {
          columnConf.dataIndex = toPath(columnConf.dataIndex);
        }
        if (columnConf.verticalAlign === "top") {
          columnConf.className
            ? (columnConf.className += " alignTop")
            : (columnConf.className = "alignTop");
        }
        if (columnConf.verticalAlign === "bottom") {
          columnConf.className
            ? (columnConf.className += " alignBottom")
            : (columnConf.className = "alignBottom");
        }
        if (ellipsisInfo) {
          columnConf.className
            ? (columnConf.className += " ellipsisInfoCell")
            : (columnConf.className = "ellipsisInfoCell");
        }
        return columnConf;
      });

      return customColumns;
    }
  }, [
    columns,
    childrenColumnName,
    expandIconAsCell,
    expandIconColumnIndex,
    expandIconColumnIndexOffset,
    rowKey,
    onDelete,
    ellipsisInfo,
  ]);

  const expandedRowRender = (record: Record<string, any>, index: number) => {
    let data = itemExpandedRowBrickDataMapRef.current.get(record);

    if (!data) {
      data = {
        rowData: record,
        rowIndex: index,
      };
      itemExpandedRowBrickDataMapRef.current.set(record, data);
    }

    return (
      <ReactUseBrick
        useBrick={props.expandedRowBrick?.useBrick as UseSingleBrickConf}
        data={data}
      />
    );
  };

  const components = {
    body: {
      row: DraggableBodyRow,
    },
  };

  const moveRow = (dragIndex: number, hoverIndex: number) => {
    const dragRow = data[dragIndex];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const newData = update(data, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, dragRow],
      ],
    });
    setData(newData);
    props.onDrag && props.onDrag(newData);
  };

  const onExpand = (expanded: boolean, record: Record<string, any>) => {
    props.onExpand && props.onExpand(expanded, record);
  };

  const onExpandedRowsChange = (expandedRows: React.Key[]) => {
    props.onExpandedRowsChange && props.onExpandedRowsChange(expandedRows);
  };

  const getCustomExpandIcon = (iconProps: any) => {
    const { record, expandable, expanded, onExpand } = iconProps;
    let icon = props.expandIcon?.collapsedIcon || downMenuIcon;
    let iconNode: React.ReactNode;
    if (expandable) {
      if (!expanded) {
        icon = props.expandIcon?.expandedIcon || rightMenuIcon;
      }
      iconNode = (
        <span
          className="expandIconSpan"
          data-testid="expand-icon"
          onClick={(e) => {
            onExpand(record, e);
          }}
        >
          <WrappedIcon {...(icon as GeneralIconProps)} />
        </span>
      );
    } else {
      iconNode = (
        <span className="expandIconSpan" data-testid="expand-icon">
          <span style={{ visibility: "hidden" }}>
            <WrappedIcon {...(icon as GeneralIconProps)} />
          </span>
        </span>
      );
    }

    if (iconNode) {
      if (!expandIconAsCell) {
        rowKeyExpandIconMapRef.current.set(
          rowKey ? record[rowKey] : record,
          iconNode
        );
      }
      return iconNode;
    } else {
      return <></>;
    }
  };

  const pickExpandProps = pickBy(
    {
      expandIconColumnIndex,
      expandIconAsCell,
      expandRowByClick: props.expandRowByClick,
      expandedRowKeys: props.expandedRowKeys,
      defaultExpandAllRows: props.defaultExpandAllRows,
    },
    (item) => !isNil(item)
  );

  let table = (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <Table
      className={classNames("brickTable", {
        expandIconCellHidden: !expandIconAsCell,
        customDropTable: props.tableDraggable,
        tableThTransparent: props.thTransparent,
        zebraPatternTable: data?.length >= 2 && props.zebraPattern,
      })}
      dataSource={data}
      {...(props.tableDraggable
        ? {
            components,
            onRow: (record, index) => ({
              index,
              moveRow: moveRow,
            }),
          }
        : {})}
      columns={customColumns}
      onChange={props.onChange}
      {...(props.expandedRowBrick
        ? {
            expandedRowRender,
          }
        : {})}
      {...pickExpandProps}
      onExpand={onExpand}
      showSorterTooltip={false}
      onExpandedRowsChange={onExpandedRowsChange}
      rowKey={rowKey}
      childrenColumnName={childrenColumnName}
      rowClassName={(record, index) => {
        if (record.invalidRow) {
          return "invalidRow";
        }
        if (record.disabledRow) {
          return "disabledRow";
        }
        return props.zebraPattern && index % 2 ? "brickTableOddRow" : "";
      }}
      expandIcon={getCustomExpandIcon}
      scroll={scroll}
      showHeader={showHeader}
      {...configProps}
    />
  );

  if (props.tableDraggable) {
    table = <DndProvider backend={HTML5Backend}>{table}</DndProvider>;
  }

  return table;
}
