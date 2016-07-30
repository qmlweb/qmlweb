registerQmlType({
  module: "QtQuick",
  name: "Grid",
  versions: /.*/,
  baseClass: "Positioner",
  enums: {
    Grid: { LeftToRight: 0, TopToBottom: 1 }
  },
  properties: {
    columns: "int",
    rows: "int",
    flow: "enum",
    layoutDirection: "enum"
  }
}, class {
  constructor(meta) {
    callSuper(this, meta);

    this.columnsChanged.connect(this, this.layoutChildren);
    this.rowsChanged.connect(this, this.layoutChildren);
    this.flowChanged.connect(this, this.layoutChildren);
    this.layoutDirectionChanged.connect(this, this.layoutChildren);
    this.layoutChildren();
  }
  layoutChildren() {
    const visibleItems = [];
    let r = 0;
    let c = 0;
    const colWidth = [];
    const rowHeight = [];
    let gridWidth = -this.spacing;
    let gridHeight = -this.spacing;
    let curHPos = 0;
    let curVPos = 0;

    // How many items are actually visible?
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      if (child.visible && child.width && child.height) {
        visibleItems.push(this.children[i]);
      }
    }

    // How many rows and columns do we need?
    if (!this.columns && !this.rows) {
      c = 4;
      r = Math.ceil(visibleItems.length / 4);
    } else if (!this.columns) {
      r = this.rows;
      c = Math.ceil(visibleItems.length / r);
    } else {
      c = this.columns;
      r = Math.ceil(visibleItems.length / c);
    }

    // How big are the colums/rows?
    if (this.flow === 0) {
      for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++) {
          const item = visibleItems[i * c + j];
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
      for (let i = 0; i < c; i++) {
        for (let j = 0; j < r; j++) {
          const item = visibleItems[i * r + j];
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

    for (const i in colWidth) {
      gridWidth += colWidth[i] + this.spacing;
    }
    for (const i in rowHeight) {
      gridHeight += rowHeight[i] + this.spacing;
    }

    // Do actual positioning
    // When layoutDirection is RightToLeft we need oposite order of coumns
    const step = this.layoutDirection === 1 ? -1 : 1;
    const startingPoint = this.layoutDirection === 1 ? c - 1 : 0;
    const endPoint = this.layoutDirection === 1 ? -1 : c;
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

    this.implicitWidth = gridWidth;
    this.implicitHeight = gridHeight;
  }
});
