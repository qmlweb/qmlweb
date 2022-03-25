// eslint-disable-next-line no-undef
class QtQuick_Layouts_RowLayout extends QtQuick_Layouts_DirectionalLayout {
  static versions = /^1\./;
  static properties = {
    layoutDirection: "enum",
    spacing: "real"
  };

  $bareLayout() {
    const layout = this.$createLayoutDescriptor();
    let children = this.children;
    let x = 0;

    if (this.layoutDirection === QmlWeb.Qt.RightToLeft) {
      children = children.slice().reverse();
    }
    for (let i = 0; i < children.length; ++i) {
      const child = children[i];
      if (!child.visible) {
        continue;
      }
      const itemWidth = this.$inferCellSize(child, "Width");
      const itemHeight = this.$inferCellSize(child, "Height");
      const rightMargin = this.$inferCellMargin(child, "right");
      const topMargin = this.$inferCellMargin(child, "top");
      const bottomMargin = this.$inferCellMargin(child, "bottom");
      const leftMargin = this.$inferCellMargin(child, "left");

      layout.cells.push({
        item: child,
        x: x + leftMargin, y: topMargin,
        z: x + leftMargin,
        width: itemWidth,
        height: itemHeight,
        horizontalMargin: leftMargin + rightMargin + this.spacing,
        verticalMargin: topMargin + bottomMargin
      });
      x += leftMargin + itemWidth + rightMargin + this.spacing;
      layout.contentHeight = Math.max(
        layout.contentHeight,
        topMargin + itemHeight + bottomMargin);
      if (child.$Layout.fillWidth) {
        layout.fillRowCount++;
      }
    }
    layout.contentWidth = x - this.spacing;
    return layout;
  }

  $fillLayoutCells(layout) {
    const extendedItems = layout.fillRowCount > 0
      ? layout.fillRowCount : layout.cells.length;
    const extraWidth = (this.implicitWidth - layout.contentWidth)
      / extendedItems;
    let offsetX = 0;

    for (let i = 0; i < layout.cells.length; ++i) {
      const cell = layout.cells[i];

      cell.x += offsetX;
      if (cell.item.$Layout.fillHeight) {
        cell.height = this.implicitHeight - cell.verticalMargin;
      }
      if (cell.item.$Layout.fillWidth || layout.fillRowCount === 0) {
        cell.width += extraWidth;
        offsetX += extraWidth;
      }
    }
  }

  $applyDirection() {
  }
}
