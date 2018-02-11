// eslint-disable-next-line no-undef
class QtQuick_Grid extends QtQuick_Positioner {
  static enums = {
    Grid: { LeftToRight: 0, TopToBottom: 1 }
  };
  static properties = {
    columns: "int",
    rows: "int",
    flow: "enum",
    layoutDirection: "enum"
  };

  constructor(meta) {
    super(meta);

    this.columnsChanged.connect(this, this.layoutChildren);
    this.rowsChanged.connect(this, this.layoutChildren);
    this.flowChanged.connect(this, this.layoutChildren);
    this.layoutDirectionChanged.connect(this, this.layoutChildren);
    this.layoutChildren();
  }
  layoutChildren() {
    // How many items are actually visible?
    const visibleItems = this.$getVisibleItems();

    // How many rows and columns do we need?
    const [c, r] = this.$calculateSize(visibleItems.length);

    // How big are the colums/rows?
    const [colWidth, rowHeight] = this.$calculateGrid(visibleItems, c, r);

    // Do actual positioning
    // When layoutDirection is RightToLeft we need oposite order of coumns
    const step = this.layoutDirection === 1 ? -1 : 1;
    const startingPoint = this.layoutDirection === 1 ? c - 1 : 0;
    const endPoint = this.layoutDirection === 1 ? -1 : c;
    let curHPos = 0;
    let curVPos = 0;
    if (this.flow === 0) {
      for (let i = 0; i < r; i++) {
        for (let j = startingPoint; j !== endPoint; j += step) {
          const item = visibleItems[i * c + j];
          if (!item) {
            break;
          }
          item.x = curHPos;
          item.y = curVPos;

          curHPos += colWidth[j] + this.spacing;
        }
        curVPos += rowHeight[i] + this.spacing;
        curHPos = 0;
      }
    } else {
      for (let i = startingPoint; i !== endPoint; i += step) {
        for (let j = 0; j < r; j++) {
          const item = visibleItems[i * r + j];
          if (!item) {
            break;
          }
          item.x = curHPos;
          item.y = curVPos;

          curVPos += rowHeight[j] + this.spacing;
        }
        curHPos += colWidth[i] + this.spacing;
        curVPos = 0;
      }
    }

    // Set implicit size
    let gridWidth = -this.spacing;
    let gridHeight = -this.spacing;
    for (const i in colWidth) {
      gridWidth += colWidth[i] + this.spacing;
    }
    for (const i in rowHeight) {
      gridHeight += rowHeight[i] + this.spacing;
    }
    this.implicitWidth = gridWidth;
    this.implicitHeight = gridHeight;
  }
  $getVisibleItems() {
    return this.children.filter(child =>
      child.visible && child.width && child.height
    );
  }
  $calculateSize(length) {
    let cols;
    let rows;
    if (!this.columns && !this.rows) {
      cols = 4;
      rows = Math.ceil(length / cols);
    } else if (!this.columns) {
      rows = this.rows;
      cols = Math.ceil(length / rows);
    } else {
      cols = this.columns;
      rows = Math.ceil(length / cols);
    }
    return [cols, rows];
  }
  $calculateGrid(visibleItems, cols, rows) {
    const colWidth = [];
    const rowHeight = [];

    if (this.flow === 0) {
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const item = visibleItems[i * cols + j];
          if (!item) {
            break;
          }
          if (!colWidth[j] || item.width > colWidth[j]) {
            colWidth[j] = item.width;
          }
          if (!rowHeight[i] || item.height > rowHeight[i]) {
            rowHeight[i] = item.height;
          }
        }
      }
    } else {
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const item = visibleItems[i * rows + j];
          if (!item) {
            break;
          }
          if (!rowHeight[j] || item.height > rowHeight[j]) {
            rowHeight[j] = item.height;
          }
          if (!colWidth[i] || item.width > colWidth[i]) {
            colWidth[i] = item.width;
          }
        }
      }
    }

    return [colWidth, rowHeight];
  }
}
