// eslint-disable-next-line no-undef
class QtQuick_Layouts_GridLayout extends QtQuick_Layouts_Positioner {
  static versions = /^1\./;
  static properties = {
    columnSpacing: { type: "real", initialValue: 5 },
    columns: "int",
    flow: "enum",
    layoutDirection: "enum",
    rowSpacing: { type: "real", initialValue: 5 },
    rows: "int"
  };
  static enums = {
    GridLayout: { LeftToRight: 0, TopToBottom: 1 }
  };

  constructor(meta) {
    super(meta);
    this.columnSpacingChanged.connect(this, this.layoutChildren);
    this.columnsChanged.connect(this, this.layoutChildren);
    this.flowChanged.connect(this, this.layoutChildren);
    this.layoutDirectionChanged.connect(this, this.layoutChildren);
    this.rowSpacingChanged.connect(this, this.layoutChildren);
    this.rowsChanged.connect(this, this.layoutChildren);
  }

  $shouldDisplay(child) {
    return child.visible
        && this.$inferCellSize(child, "Height") > 0
        && this.$inferCellSize(child, "Width") > 0;
  }

  $bareLayout() {
    const layout = this.$createLayoutDescriptor();

    this.$assignItemsToCells(layout);
    layout.rows = 0;
    layout.columns = layout.cells.length;
    for (let column = 0; column < layout.columns; ++column) {
      layout.rows = Math.max(layout.rows, layout.cells[column].length);
    }
    this.$setCellPreferredGeometry(layout);
    this.$setContentSize(layout);
    return layout;
  }

  $assignItemsToCells(layout) {
    switch (this.flow) {
      case this.GridLayout.TopToBottom:
        this.$assignItemsToCellsTopToBottom(layout);
        break;
      default:
        this.$assignItemsToCellsLeftToRight(layout);
        break;
    }
  }

  $assignItemsToCellsTopToBottom(layout) {
    const index = { row: 0, column: 0 };

    for (let i = 0; i < this.children.length; ++i) {
      const child = this.children[i];
      const itemSpan = child.$Layout.rowSpan || 1;
      const span = this.rows ? Math.min(itemSpan, this.rows) : 1;

      if (!this.$shouldDisplay(child)) {
        continue;
      }
      this.$itemAssigner(
        layout, child, index,
        { column: 1, row: span },
        this.$onTopToBottomNextIndex.bind(this)
      );
    }
  }

  $assignItemsToCellsLeftToRight(layout) {
    const index = { row: 0, column: 0 };

    for (let i = 0; i < this.children.length; ++i) {
      const child = this.children[i];
      const itemSpan = child.$Layout.columnSpan || 1;
      const span = this.columns ? Math.min(itemSpan, this.columns) : 1;

      if (!this.$shouldDisplay(child)) {
        continue;
      }
      this.$itemAssigner(
        layout, child, index,
        { column: span, row: 1 },
        this.$onLeftToRightNextIndex.bind(this)
      );
    }
  }

  $onTopToBottomNextIndex(index, span) {
    const nextIndex = index.row + span.row;

    if (this.rows && nextIndex >= this.rows) {
      index.row = 0;
      index.column++;
    } else {
      index.row = nextIndex;
    }
  }

  $onLeftToRightNextIndex(index, span) {
    const nextIndex = index.column + span.column;

    if (this.columns && nextIndex >= this.columns) {
      index.column = 0;
      index.row++;
    } else {
      index.column = nextIndex;
    }
  }

  $itemAssigner(layout, child, index, span, onNextIndex) {
    if (child.$Layout.column !== null || child.$Layout.row !== null) {
      index.column = child.$Layout.column || 0;
      index.row = child.$Layout.row || 0;
      this.$pushItemToCell(layout, child, index.column, index.row);
    } else {
      let spaceAvailable = false;
      while (!spaceAvailable) {
        spaceAvailable = this.$checkSpanAvailability(
          layout, index.column, index.row, span.column, span.row
        );
        if (!spaceAvailable) {
          onNextIndex(index, { column: 1, row: 1 });
        }
      }
      this.$pushItemToCell(layout, child, index.column, index.row);
      onNextIndex(index, span);
    }
  }

  $setCellPreferredGeometry(layout) {
    for (let x = 0; x < layout.columns; ++x) {
      for (let y = 0; y < layout.rows; ++y) {
        const cell = layout.cells[x] ? layout.cells[x][y] : null;

        if (cell) {
          const vMargin = this.$inferCellMargin(cell.occupant, "top") +
                          this.$inferCellMargin(cell.occupant, "bottom");
          const hMargin = this.$inferCellMargin(cell.occupant, "left") +
                          this.$inferCellMargin(cell.occupant, "right");
          const height = this.$inferCellSize(cell.occupant, "Height");
          const width = this.$inferCellSize(cell.occupant, "Width");
          const vSpan = Math.max(cell.occupant.$Layout.columnSpan, 1);
          const hSpan = Math.max(cell.occupant.$Layout.rowSpan, 1);

          cell.width = (width + hMargin) / hSpan;
          cell.height = (height + vMargin) / vSpan;
        }
      }
    }
  }

  $setContentSize(layout) {
    for (let x = 0; x < layout.columns; ++x) {
      layout.contentWidth = Math.max(
        layout.contentWidth,
        this.$getRowWidth(layout, x)
      );
    }
    layout.contentWidth += this.columnSpacing * (layout.columns - 1);
    for (let y = 0; y < layout.rows; ++y) {
      layout.contentHeight = Math.max(
        layout.contentHeight,
        this.$getColumnHeight(layout, y)
      );
    }
    layout.contentHeight += this.rowSpacing * (layout.rows - 1);
  }

  $fillLayoutCells(layout) {
    const margins = this.$getUnusedSpace(layout);

    this.$prepareCellSize(layout, margins);
    switch (this.layoutDirection) {
      case QmlWeb.Qt.RightToLeft:
        this.$fillLayoutCellsRTL(layout, margins);
        break;
      default:
        this.$fillLayoutCellsLTR(layout, margins);
        break;
    }
  }

  $getUnusedSpace(layout) {
    let x = 0;
    let y = 0;

    if (!this.$isUsingImplicitWidth) {
      x = Math.max(0, layout.maxWidth - layout.contentWidth);
      x /= layout.columns;
    }
    if (!this.$isUsingImplicitHeight) {
      y = Math.max(0, layout.maxHeight - layout.contentHeight);
      y /= layout.rows;
    }
    return { x, y };
  }

  //
  // Cell Sizing
  //
  $getCellWeight(cell, size, words) {
    const child = cell ? cell.occupant : null;
    const { direction, margins, span } = words;

    if (child && child.$Layout[`fill${direction}`] && child.$Layout[span] < 2) {
      let cellSize = this.$inferCellSize(child, direction);
      margins.forEach(margin => {
        cellSize += this.$inferCellMargin(child, margin);
      });
      return Math.max(size, cellSize);
    }
    return size;
  }

  $getColumnWeights(layout) {
    const weights = [];
    let totalWeight = 0;

    for (let x = 0; x < layout.columns; ++x) {
      let size = 0;
      for (let y = 0; y < layout.rows; ++y) {
        const cell = layout.cells[x] ? layout.cells[x][y] : null;

        size = this.$getCellWeight(cell, size, {
          direction: "Width",
          margins: ["left", "right"],
          span: "columnSpan"
        });
      }
      weights.push(size);
      totalWeight += size;
    }
    return { weights, totalWeight };
  }

  $getRowWeights(layout) {
    const weights = [];
    let totalWeight = 0;

    for (let y = 0; y < layout.rows; ++y) {
      let size = 0;
      for (let x = 0; x < layout.columns; ++x) {
        const cell = layout.cells[x] ? layout.cells[x][y] : null;

        size = this.$getCellWeight(cell, size, {
          direction: "Height",
          margins: ["top", "bottom"],
          span: "rowSpan"
        });
      }
      weights.push(size);
      totalWeight += size;
    }
    return { weights, totalWeight };
  }

  $backupCells(layout) {
    const newCells = [];
    for (let x = 0; x < layout.columns; ++x) {
      newCells[x] = [];
      for (let y = 0; y < layout.rows; ++y) {
        const cell = layout.cells[x][y];
        if (cell) {
          newCells[x][y] = {
            width: cell.width, height: cell.height
          };
        }
      }
    }
    return newCells;
  }

  $prepareCellSize(layout, margins) {
    const columnWeights = this.$getColumnWeights(layout);
    const rowWeights = this.$getRowWeights(layout);
    const backupLayout = {
      rows: layout.rows, columns: layout.columns,
      cells: this.$backupCells(layout)
    };

    this.$cellSizeProbe(layout, {
      margin: margins.x * layout.columns,
      count: layout.columns,
      direction: "Width",
      cellMarginGetter: this.$inferCellHMargin.bind(this),
      baseSizeGetter: x => this.$getColumnWidth(backupLayout, x),
      weightGetter: x => columnWeights.weights[x],
      totalWeight: columnWeights.totalWeight
    });
    this.$cellSizeProbe(layout, {
      margin: margins.y * layout.rows,
      count: layout.rows,
      direction: "Height",
      cellMarginGetter: this.$inferCellVMargin.bind(this),
      baseSizeGetter: (x, y) => this.$getRowHeight(backupLayout, y),
      weightGetter: (x, y) => rowWeights.weights[y],
      totalWeight: rowWeights.totalWeight
    });
  }

  $cellSizeProbe(layout, args) {
    const {
      margin,
      count,
      direction,
      cellMarginGetter,
      baseSizeGetter,
      weightGetter,
      totalWeight
    } = args;
    const propertyName = direction[0].toLowerCase() + direction.slice(1);
    const itemProp = `item${direction}`;

    // Prepare individual cell size
    for (let y = 0; y < layout.rows; ++y) {
      for (let x = 0; x < layout.columns; ++x) {
        const cell = this.$getCellDescriptor(layout, x, y);
        const weight = weightGetter(x, y);
        const bonus = margin / totalWeight * weight;

        if (!cell) {
          continue;
        }
        // Determine cell size
        if (totalWeight === 0) {
          cell[propertyName] = baseSizeGetter(x, y) + margin / count;
        } else if (weight > 0) {
          cell[propertyName] = weight + bonus;
        } else {
          cell[propertyName] = baseSizeGetter(x, y);
        }
      }
    }
    // Have spanned cell absorb their neighbors
    const attr = direction === "Width" ? "column" : "rows";
    for (let y = 0; y < layout.rows; ++y) {
      for (let x = 0; x < layout.columns; ++x) {
        const cell = this.$getCellDescriptor(layout, x, y);
        const child = cell ? cell.item : null;
        if (child) {
          cell[`outer${direction}`] = cell[propertyName];
          for (let i = 0; i < child.$Layout[`${attr}Span`] - 1; ++i) {
            const absorbedCell = direction === "Width"
              ? this.$getCellDescriptor(layout, x + 1, y)
              : this.$getCellDescriptor(layout, x, y + 1);
            cell[`outer${direction}`] += absorbedCell[propertyName];
          }
        }
      }
    }
    // Prepare item size
    for (let y = 0; y < layout.rows; ++y) {
      for (let x = 0; x < layout.columns; ++x) {
        const cell = this.$getCellDescriptor(layout, x, y);
        const child = cell ? cell.item : null;
        if (child) {
          const max = child.$Layout[`maximum${direction}`];
          const min = child.$Layout[`minimum${direction}`];

          if (child.$Layout[`fill${direction}`]) {
            const cellMargin = cellMarginGetter(child);
            const cellOuter = cell[`outer${direction}`] || cell[propertyName];
            cell[itemProp] = cellOuter - cellMargin;
          } else {
            cell[itemProp] = this.$inferCellSize(child, direction);
          }
          if (max !== null) {
            cell[itemProp] = Math.min(cell[itemProp], max);
          }
          if (min !== null) {
            cell[itemProp] = Math.max(cell[itemProp], min);
          }
        }
      }
    }
  }

  $alignItemInCell(cell, rtl) {
    let alignment = cell.item.$Layout.alignment !== null
      ? cell.item.$Layout.alignment
      : QmlWeb.Qt.AlignVCenter | QmlWeb.Qt.AlignLeft;
    const lMargin = this.$inferCellMargin(cell.occupant, "left");
    const rMargin = this.$inferCellMargin(cell.occupant, "right");
    const tMargin = this.$inferCellMargin(cell.occupant, "top");
    const bMargin = this.$inferCellMargin(cell.occupant, "bottom");
    const outerHeight = cell.outerHeight || cell.height;
    const outerWidth = cell.outerWidth || cell.width;

    if (rtl) {
      if (alignment & QmlWeb.Qt.AlignLeft) {
        alignment = alignment - QmlWeb.Qt.AlignLeft + QmlWeb.Qt.AlignRight;
      } else if (alignment & QmlWeb.Qt.AlignRight) {
        alignment = alignment - QmlWeb.Qt.AlignRight + QmlWeb.Qt.AlignLeft;
      }
      cell.x -= outerWidth - cell.width;
    }

    if (alignment & QmlWeb.Qt.AlignLeft) {
      cell.itemX = cell.x + lMargin;
    } else if (alignment & QmlWeb.Qt.AlignRight) {
      cell.itemX = cell.x + outerWidth - cell.itemWidth - rMargin;
    } else { // AlignVCenter
      const innerWidth = outerWidth - lMargin - rMargin;
      cell.itemX = cell.x + innerWidth / 2 - cell.itemWidth / 2;
    }

    if (alignment & QmlWeb.Qt.AlignTop) {
      cell.itemY = cell.y + tMargin;
    } else if (alignment & QmlWeb.Qt.AlignBottom) {
      cell.itemY = cell.y + outerHeight - cell.itemHeight - bMargin;
    } else { // AlignHCenter
      const innerHeight = outerHeight - tMargin - bMargin;
      cell.itemY = cell.y + innerHeight / 2 - cell.itemHeight / 2;
    }
  }

  $fillLayoutCellsRTL(layout) {
    let ox = this.implicitWidth;

    for (let x = 0; x < layout.columns; ++x) {
      let oy = 0;
      let maxX = 0;

      for (let y = 0; y < layout.rows; ++y) {
        const cell = layout.cells[x] ? layout.cells[x][y] : null;

        if (cell) {
          cell.x = ox - cell.width;
          cell.y = oy;
          oy += cell.height + this.rowSpacing;
          maxX = Math.max(maxX, cell.width);
          if (cell.item) {
            this.$alignItemInCell(cell, true);
          }
        }
      }
      ox -= maxX + this.columnSpacing;
    }
  }

  $fillLayoutCellsLTR(layout) {
    let ox = 0;

    for (let x = 0; x < layout.columns; ++x) {
      let oy = 0;
      let maxX = 0;

      for (let y = 0; y < layout.rows; ++y) {
        const cell = layout.cells[x] ? layout.cells[x][y] : null;

        if (cell) {
          cell.x = ox;
          cell.y = oy;
          oy += cell.height + this.rowSpacing;
          maxX = Math.max(maxX, cell.width);
          if (cell.item) {
            this.$alignItemInCell(cell);
          }
        }
      }
      ox += maxX + this.columnSpacing;
    }
  }

  $applyLayout(layout) {
    for (let x = 0; x < layout.columns; ++x) {
      for (let y = 0; y < layout.rows; ++y) {
        const cell = layout.cells[x][y];
        if (cell && cell.item) {
          cell.item.x = cell.itemX;
          cell.item.y = cell.itemY;
          cell.item.width = cell.itemWidth;
          cell.item.height = cell.itemHeight;
        }
      }
    }
  }

  //
  // Column and row dimension helpers
  //
  $getRowWidth(layout, row) {
    let total = 0;
    for (let x = 0; x < layout.columns; ++x) {
      const cell = this.$getCellDescriptor(layout, x, row);
      if (cell) {
        total += cell.width;
      }
    }
    return total;
  }

  $getRowHeight(layout, row) {
    let total = 0;
    for (let x = 0; x < layout.columns; ++x) {
      const cell = this.$getCellDescriptor(layout, x, row);
      if (cell) {
        total = Math.max(total, cell.height);
      }
    }
    return total;
  }

  $getColumnWidth(layout, column) {
    let total = 0;
    for (let y = 0; y < layout.rows; ++y) {
      const cell = this.$getCellDescriptor(layout, column, y);
      if (cell) {
        total = Math.max(total, cell.width);
      }
    }
    return total;
  }

  $getColumnHeight(layout, column) {
    let total = 0;
    for (let y = 0; y < layout.rows; ++y) {
      const cell = this.$getCellDescriptor(layout, column, y);
      if (cell) {
        total += cell.height;
      }
    }
    return total;
  }

  //
  // Cell management helpers
  //
  $createCellDescriptor() {
    return { item: null, width: 0, height: 0 };
  }

  $pushItemToCell(layout, item, column, row) {
    const columnSpan = item.$Layout.columnSpan || 1;
    const rowSpan = item.$Layout.rowSpan || 1;

    for (let x = column; x < column + columnSpan; ++x) {
      for (let y = row; y < row + rowSpan; ++y) {
        const cell = this.$requireCellDescriptor(layout, x, y);

        if (cell === null) {
          continue;
        }
        cell.occupied = true;
        cell.occupant = item;
        if (x === column && y === row) {
          cell.item = item;
        }
      }
    }
  }

  $getCellDescriptor(layout, x, y) {
    return layout.cells[x] ? layout.cells[x][y] : null;
  }

  $requireCellDescriptor(layout, column, row) {
    if (!this.columns || column < this.columns &&
        !this.rows || row < this.rows) {
      const columnArray = layout.cells[column] || [];
      const cell = columnArray[row] || this.$createCellDescriptor();

      columnArray[row] = cell;
      layout.cells[column] = columnArray;
      return cell;
    }
    return null;
  }

  $checkSpanAvailability(layout, column, row, width, height) {
    if (this.flow === this.GridLayout.LeftToRight) {
      if (width > this.columns) {
        return true; // too big to ever fit
      }
      if (column + width > this.columns) {
        return false; // too big for current row
      }
    } else if (this.flow === this.GridLayout.TopToBottom) {
      if (height > this.rows) {
        return true; // too big to ever fit
      }
      if (row + height > this.rows) {
        return false; // too big for current column
      }
    }
    for (let x = column; x < column + width; ++x) {
      for (let y = row; y < row + height; ++y) {
        const cell = this.$requireCellDescriptor(layout, x, y);
        if (!cell || cell.occupied) {
          return false;
        }
      }
    }
    return true;
  }
}
