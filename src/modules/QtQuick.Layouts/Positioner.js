// eslint-disable-next-line no-undef
class QtQuick_Layouts_Positioner extends QtQuick_Item {
  constructor(meta) {
    super(meta);
    this.spacingChanged.connect(this, this.layoutChildren);
    this.layoutDirectionChanged.connect(this, this.layoutChildren);
    this.childrenChanged.connect(this, this.$onChildrenChanged);
    this.childrenChanged.connect(this, this.layoutChildren);
    this.widthChanged.connect(this, this.$onWidthChanged);
    this.heightChanged.connect(this, this.$onHeightChanged);
    this.layoutChildren();
  }

  layoutChildren() {
    if (this.children.length > 0) {
      const layout = this.$bareLayout();

      this.implicitWidth = this.$isUsingImplicitWidth
        ? layout.contentWidth : layout.maxWidth;
      this.implicitHeight = this.$isUsingImplicitHeight
        ? layout.contentHeight : layout.maxHeight;
      this.$fillLayoutCells(layout);
      this.$applyDirection(layout);
      this.$applyLayout(layout);
    } else {
      this.implicitWidth = this.implicitHeight = 0;
    }
  }

  $applyLayout(layout) {
    for (let i = 0; i < layout.cells.length; ++i) {
      const cell = layout.cells[i];

      cell.item.x = cell.x;
      cell.item.y = cell.y;
      cell.item.width = cell.width;
      cell.item.height = cell.height;
    }
  }

  $plugChildrenSignals(children, action) {
    const Layout = QmlWeb.getConstructor("QtQuick.Layouts", "1.0", "Layout");
    const flags = QmlWeb.Signal.UniqueConnection;
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      child.$Layout = Layout.getAttachedObject.bind(child)();
      for (const property in child.$Layout.$properties) {
        const signal = child.$Layout.$properties[property].changed;
        signal[action](this, this.layoutChildren, flags);
      }
      child.implicitWidthChanged[action](this, this.layoutChildren, flags);
      child.implicitHeightChanged[action](this, this.layoutChildren, flags);
      child.visibleChanged[action](this, this.layoutChildren, flags);
    }
  }

  $onChildrenChanged(newVal, oldVal) {
    this.$plugChildrenSignals(oldVal, "disconnect");
    this.$plugChildrenSignals(newVal, "connect");
  }

  $onWidthChanged() {
    if (!this.$isUsingImplicitWidth) {
      this.layoutChildren();
    }
  }

  $onHeightChanged() {
    if (!this.$isUsingImplicitHeight) {
      this.layoutChildren();
    }
  }

  $createLayoutDescriptor() {
    return {
      cells: [],
      maxWidth: this.$isUsingImplicitWidth ? 0 : this.width,
      maxHeight: this.$isUsingImplicitHeight ? 0 : this.height,
      contentWidth: 0,
      contentHeight: 0,
      fillColumnCount: 0,
      fillRowCount: 0
    };
  }

  $inferCellSize(child, direction) {
    let size = child[`implicit${direction}`];

    if (child.$Layout[`preferred${direction}`]) {
      size = child.$Layout[`preferred${direction}`];
    }
    if (child.$Layout[`minimum${direction}`]) {
      size = Math.max(child.$Layout[`minimum${direction}`], size);
    }
    if (child.$Layout[`maximum${direction}`]) {
      size = Math.min(child.$Layout[`maximum${direction}`], size);
    }
    return size;
  }

  $inferCellMargin(child, direction) {
    const directionMargin = child.$Layout[`${direction}Margin`];
    const generalMargin = child.$Layout.margins;

    return directionMargin === null ? generalMargin : directionMargin;
  }
}
