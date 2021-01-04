/* istanbul-ignore-file */
// Todo(steve): Ignore tests temporarily for potential breaking change in the future.
export interface DropPosition {
  rect: DropPositionRect;
  cursor: DropPositionCursor;
}

export interface DropPositionRect {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface DropPositionCursor {
  index: number;
  y: number;
  isVertical?: boolean;
  x?: number;
  height?: number;
}

export interface DropGridRow {
  cells: DropGridCell[];
  top?: number;
  bottom?: number;
  // isInline?: boolean;
}

export interface DropGridCell extends DropPositionRect {
  index: number;
}

const defaultGap = 12;

export function getDropPositions(
  dropZone: HTMLElement,
  dropZoneGrid: HTMLElement
): DropPosition[] {
  const zoneRect = dropZone.getBoundingClientRect();
  // const gridRect = dropZoneGrid.getBoundingClientRect();
  const positions: DropPosition[] = [];
  const gridItemList = Array.from(dropZoneGrid.children);
  if (gridItemList.length > 0) {
    let currentRow: DropGridRow = {
      cells: [],
    };
    const rows: DropGridRow[] = [currentRow];
    gridItemList.forEach((gridItem, index) => {
      const rect = gridItem.getBoundingClientRect();
      const cell: DropGridCell = {
        index,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
      };
      const prevCell =
        currentRow.cells.length > 0 &&
        currentRow.cells[currentRow.cells.length - 1];
      if (
        !prevCell ||
        (compareApproximately(rect.left, prevCell.right) > 0 &&
          compareApproximately(rect.top, prevCell.bottom) < 0)
      ) {
        currentRow.cells.push(cell);
        currentRow.top = Math.min(currentRow.top ?? Infinity, rect.top);
        currentRow.bottom = Math.max(
          currentRow.bottom ?? -Infinity,
          rect.bottom
        );
      } else {
        currentRow = {
          cells: [cell],
          top: rect.top,
          bottom: rect.bottom,
        };
        rows.push(currentRow);
      }
    });
    // console.log(rows);

    let lastRectBottom = zoneRect.top;
    let nextCursorTop = zoneRect.top;
    rows.forEach((row, rowIndex) => {
      if (row.cells.length === 1) {
        const cell = row.cells[0];
        const rectBottom = (cell.top + cell.bottom) / 2;
        positions.push({
          rect: {
            top: lastRectBottom,
            bottom: rectBottom,
            left: zoneRect.left,
            right: zoneRect.right,
          },
          cursor: {
            index: cell.index,
            y: (nextCursorTop + cell.top) / 2 - zoneRect.top,
          },
        });
        lastRectBottom = rectBottom;
        nextCursorTop = cell.bottom;

        // Append one more insert position after reached the end.
        if (rowIndex === rows.length - 1) {
          positions.push({
            rect: {
              top: lastRectBottom,
              bottom: zoneRect.bottom,
              left: zoneRect.left,
              right: zoneRect.right,
            },
            cursor: {
              index: cell.index + 1,
              y:
                Math.min(
                  cell.bottom + defaultGap,
                  (cell.bottom + zoneRect.bottom) / 2
                ) - zoneRect.top,
            },
          });
        } else if (rows[rowIndex + 1].cells.length > 1) {
          const nextRow = rows[rowIndex + 1];
          const rectBottom = (cell.bottom + nextRow.top) / 2;
          positions.push({
            rect: {
              top: lastRectBottom,
              bottom: rectBottom,
              left: zoneRect.left,
              right: zoneRect.right,
            },
            cursor: {
              index: cell.index + 1,
              y: rectBottom - zoneRect.top,
            },
          });
          lastRectBottom = rectBottom;
        }
      } else {
        let lastRectRight = zoneRect.left;
        let nextCursorLeft = zoneRect.left;
        const rectBottom =
          rowIndex < rows.length - 1
            ? (rows[rowIndex + 1].top + row.bottom) / 2
            : zoneRect.bottom;
        const cursorDefault: Pick<
          DropPositionCursor,
          "isVertical" | "y" | "height"
        > = {
          isVertical: true,
          y: row.top - zoneRect.top,
          height: row.bottom - row.top,
        };
        row.cells.forEach((cell, cellIndex) => {
          const rectRight = (cell.left + cell.right) / 2;
          positions.push({
            rect: {
              top: lastRectBottom,
              bottom: rectBottom,
              left: lastRectRight,
              right: rectRight,
            },
            cursor: {
              ...cursorDefault,
              index: cell.index,
              x: (nextCursorLeft + cell.left) / 2 - zoneRect.left,
            },
          });
          lastRectRight = rectRight;
          nextCursorLeft = cell.right;

          // Append one more insert position after reached the row end.
          if (cellIndex === row.cells.length - 1) {
            if (rowIndex === rows.length - 1) {
              positions.push({
                rect: {
                  top: lastRectBottom,
                  bottom: zoneRect.bottom,
                  left: lastRectRight,
                  right: zoneRect.right,
                },
                cursor: {
                  ...cursorDefault,
                  index: cell.index + 1,
                  x: nextCursorLeft + defaultGap - zoneRect.left,
                },
              });
            } else {
              positions.push({
                rect: {
                  top: lastRectBottom,
                  bottom: rectBottom,
                  left: lastRectRight,
                  right: zoneRect.right,
                },
                cursor: {
                  ...cursorDefault,
                  index: cell.index + 1,
                  x: nextCursorLeft + defaultGap - zoneRect.left,
                },
              });
            }
          }
        });
        lastRectBottom = rectBottom;
        nextCursorTop = row.bottom;
      }
    });
  }
  return positions;
}

export function getDropPosition(
  x: number,
  y: number,
  dropZone: HTMLElement,
  dropZoneGrid: HTMLElement
): DropPositionCursor {
  const positions = getDropPositions(dropZone, dropZoneGrid);
  for (const { rect, cursor } of positions) {
    if (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    ) {
      // console.log((event.target as HTMLElement).tagName, cursor.isVertical, cursor.index);
      return cursor;
    }
  }

  return {
    index: 0,
    y: defaultGap,
  };
}

function compareApproximately(a: number, b: number): number {
  const diff = a - b;
  return Math.abs(diff) < 1 ? 0 : diff;
}
