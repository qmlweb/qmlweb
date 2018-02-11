// eslint-disable-next-line no-undef
class QtQuick_Column extends QtQuick_Positioner {
  layoutChildren() {
    let curPos = this.padding;
    let maxWidth = 0;
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      if (!child.visible || !child.width || !child.height) {
        continue;
      }
      maxWidth = child.width > maxWidth ? child.width : maxWidth;
      child.y = curPos + this.padding;
      if (this.padding > 0) child.x = this.padding;
      curPos += child.height + this.spacing;
    }
    this.implicitWidth = maxWidth + this.padding * 2;
    this.implicitHeight = curPos - this.spacing + this.padding;
    // We want no spacing at the bottom side
  }
}
