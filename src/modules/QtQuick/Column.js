QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Column",
  versions: /.*/,
  baseClass: "Positioner"
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);
  }
  layoutChildren() {
    let curPos = 0;
    let maxWidth = 0;
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      if (!child.visible || !child.width || !child.height) {
        continue;
      }
      maxWidth = child.width > maxWidth ? child.width : maxWidth;
      child.y = curPos;
      curPos += child.height + this.spacing;
    }
    this.implicitWidth = maxWidth;
    this.implicitHeight = curPos - this.spacing;
    // We want no spacing at the bottom side
  }
});
