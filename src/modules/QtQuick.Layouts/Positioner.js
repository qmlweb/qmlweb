// eslint-disable-next-line no-undef
class QtQuick_Layouts_Positioner extends QtQuick_Layouts_AbstractLayout {
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

  $plugChildrenSignals(children, action) {
    super.$plugChildrenSignals(children, action, ["visible"]);
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

  $applyDirection() {
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
}
