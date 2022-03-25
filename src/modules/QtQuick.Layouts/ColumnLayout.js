// eslint-disable-next-line no-undef
class QtQuick_Layouts_ColumnLayout extends QtQuick_Layouts_DirectionalLayout {
  static versions = /^1\./;
  static properties = {
    layoutDirection: "enum",
    spacing: "real"
  };

  $bareLayout() {
    const layout = this.$createLayoutDescriptor();
    let y = 0;

    for (let i = 0; i < this.children.length; ++i) {
      const child = this.children[i];
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
        x: leftMargin, y: y + topMargin,
        width: itemWidth,
        height: itemHeight,
        horizontalMargin: leftMargin + rightMargin,
        verticalMargin: topMargin + bottomMargin + this.spacing
      });
      y += topMargin + itemHeight + bottomMargin + this.spacing;
      layout.contentWidth = Math.max(
        layout.contentWidth,
        leftMargin + itemWidth + rightMargin);
      if (child.$Layout.fillHeight) {
        layout.fillColumnCount++;
      }
    }
    layout.contentHeight = y - this.spacing;
    return layout;
  }

  $fillLayoutCells(layout) {
    const extendedItems = layout.fillColumnCount > 0
      ? layout.fillColumnCount : layout.cells.length;
    const extraHeight = (this.implicitHeight - layout.contentHeight)
      / extendedItems;
    let offsetY = 0;

    for (let i = 0; i < layout.cells.length; ++i) {
      const cell = layout.cells[i];

      cell.y += offsetY;
      if (cell.item.$Layout.fillWidth) {
        cell.width = this.implicitWidth - cell.horizontalMargin;
      }
      if (cell.item.$Layout.fillHeight || layout.fillColumnCount === 0) {
        cell.height += extraHeight;
        offsetY += extraHeight;
      }
    }
  }

  $applyDirection(layout) {
    if (this.layoutDirection === QmlWeb.Qt.RightToLeft) {
      for (let i = 0; i < layout.cells.length; ++i) {
        const cell = layout.cells[i];
        const rightMargin = this.$inferCellMargin(cell.item, "right");
        cell.x = this.implicitWidth - (cell.width + rightMargin);
      }
    }
  }
}
