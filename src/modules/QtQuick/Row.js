QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "Row",
  versions: /.*/,
  baseClass: "Positioner",
  properties: {
    layoutDirection: "enum"
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    this.layoutDirectionChanged.connect(this, this.layoutChildren);
    this.layoutChildren();
  }
  layoutChildren() {
    let curPos = this.padding;
    let maxHeight = 0;
    // When layoutDirection is RightToLeft we need oposite order
    let i = this.layoutDirection === 1 ? this.children.length - 1 : 0;
    const endPoint = this.layoutDirection === 1 ? -1 : this.children.length;
    const step = this.layoutDirection === 1 ? -1 : 1;
    for (; i !== endPoint; i += step) {
      const child = this.children[i];
      if (!(child.visible && child.width && child.height)) {
        continue;
      }
      maxHeight = child.height > maxHeight ? child.height : maxHeight;

      child.x = curPos;
      if (this.padding > 0) child.y = this.padding;

      curPos += child.width + this.spacing;
    }
    this.implicitHeight = maxHeight + this.padding*2;
    // We want no spacing at the right side
    this.implicitWidth = curPos - this.spacing + this.padding;
  }
});
